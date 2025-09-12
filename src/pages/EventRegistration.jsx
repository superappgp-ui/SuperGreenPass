
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Event } from '@/api/entities';
import { EventRegistration } from '@/api/entities';
import { User } from '@/api/entities';
import { BankSettings } from '@/api/entities';
import { Payment } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, MapPin, CheckCircle, Info, ChevronLeft, Lock } from "lucide-react";
import { format } from 'date-fns';
import DynamicRegistrationForm from '../components/events/DynamicRegistrationForm';
import SharedPaymentGateway from '../components/payments/SharedPaymentGateway';
import { createPageUrl } from '@/components/URLRedirect';
import { getText, getLang } from '@/pages/Layout';

export default function EventRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General loading error
  const [selectedTier, setSelectedTier] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Tier Select, 2: Form, 3: Payment
  const [currentUser, setCurrentUser] = useState(null);
  const [registrationError, setRegistrationError] = useState(null); // Error for registration process
  const [createdRegistration, setCreatedRegistration] = useState(null); // Stores the registration object after form submission
  const [fxRate, setFxRate] = useState(1.35); // CAD to USD rate

  const fetchEventDetails = useCallback(async (eventId) => {
    setLoading(true);
    setError(null);
    try {
      const [eventData] = await Event.filter({ event_id: eventId });
      if (!eventData) {
        setError(getText('Event not found.'));
        setLoading(false);
        navigate(createPageUrl('Events'));
        return;
      }
      setEvent(eventData);

      // Fetch current user
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (err) {
        console.warn('User not logged in or session expired:', err);
        setCurrentUser(null); // User might not be logged in, that's fine
      }

      // Fetch FX rate from BankSettings
      try {
        const bankSettings = await BankSettings.filter({ key: 'CAD_USD_FX_RATE' }); // Changed to CAD_USD_FX_RATE
        if (bankSettings && bankSettings.length > 0) {
          setFxRate(parseFloat(bankSettings[0].value));
        }
      } catch (fxError) {
        console.error("Failed to fetch FX rate:", fxError);
        // Keep default fxRate if fetch fails
      }

      // Auto-select tier from URL param
      const tierKey = searchParams.get('tierKey');
      if (tierKey && eventData.registration_tiers) {
        const tier = eventData.registration_tiers.find(t => t.key === tierKey);
        if (tier) {
          setSelectedTier(tier);
        }
      } else if (eventData.registration_tiers?.length === 1) {
        setSelectedTier(eventData.registration_tiers[0]);
      }

    } catch (err) {
      console.error("Error fetching event details:", err);
      setError(getText('Failed to load event details. Please try again.'));
      navigate(createPageUrl('Events'));
    } finally {
      setLoading(false);
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      fetchEventDetails(eventId);
    } else {
        // Only set error if we are on the registration page and there's no ID.
        // This prevents the error from flashing on navigation to other pages.
        if (location.pathname.includes('/EventRegistration')) {
             setError(getText('Event ID is missing.'));
        }
        setLoading(false);
    }
  }, [searchParams, fetchEventDetails, location.pathname]);

  // This function is no longer directly called from DynamicRegistrationForm's props,
  // its logic is now expected to be handled internally by DynamicRegistrationForm.
  // Keeping it as per instruction, but it's effectively not used by DynamicRegistrationForm anymore.
  const handleRegistrationSubmit = async (formData) => {
    setLoading(true);
    setRegistrationError(null);
    const eventId = event.event_id;

    try {
      const registrationPayload = {
        event_id: eventId,
        role: selectedTier.key,
        contact_name: formData.contact_name || '',
        contact_email: formData.contact_email || '',
        phone: formData.phone || '',
        organization_name: formData.organization_name || '',
        guest_country: formData.guest_country || '',
        amount_usd: selectedTier.price_usd,
        amount_cad: selectedTier.price_usd * fxRate, // Changed from amount_vnd
        fx_rate: fxRate,
        // Removed status and hold_expires_at from here as payment record will handle status
        is_guest_registration: !currentUser,
        ...formData,
        reservation_code: `EVT-${eventId.slice(-4)}-${Date.now().toString().slice(-6)}`,
        ...(currentUser && { user_id: currentUser.id }),
      };

      const newRegistration = await EventRegistration.create(registrationPayload);

      const qrDataString = JSON.stringify({
        reservation_code: newRegistration.reservation_code,
        event_id: eventId,
        registration_id: newRegistration.id,
        attendee_name: registrationPayload.contact_name,
        organization: registrationPayload.organization_name,
        tier: selectedTier.name
      });

      const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrDataString)}`;

      const finalRegistration = await EventRegistration.update(newRegistration.id, {
        qr_data: qrDataString,
        qr_code_url: qr_code_url
      });

      setCreatedRegistration(finalRegistration);
      setCurrentStep(3);
    } catch (err) {
      console.error("Registration failed:", err);
      setRegistrationError(err.message || getText("An unexpected error occurred during registration."));
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRecord = async (registration, method, status, transactionId, receiptUrl, paymentDetails) => {
    const paymentPayload = {
      related_entity_id: registration.id,
      related_entity_type: 'event_registration',
      provider: method,
      amount_usd: registration.amount_usd,
      amount_cad: registration.amount_cad, // Changed from registration.amount_vnd
      fx_rate: registration.fx_rate,
      status: status,
      transaction_id: transactionId,
      receipt_url: receiptUrl,
      payer_name: registration.contact_name,
      payer_email: registration.contact_email,
      payment_details: paymentDetails,
      ...(currentUser && { user_id: currentUser.id }),
    };

    const newPayment = await Payment.create(paymentPayload);
    await EventRegistration.update(registration.id, { payment_id: newPayment.id });
    return newPayment;
  };


  const handlePaymentSuccess = async (paymentMethod, transactionId, paymentDetails) => {
    setLoading(true);
    setRegistrationError(null);
    try {
      if (!createdRegistration) {
        throw new Error("No registration found to update.");
      }

      const newPayment = await createPaymentRecord(createdRegistration, paymentMethod, 'successful', transactionId, null, paymentDetails);

      await EventRegistration.update(createdRegistration.id, {
        status: 'paid',
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        transaction_id: transactionId,
        payment_id: newPayment.id,
      });

      navigate(createPageUrl(`EventRegistrationSuccess?registrationId=${createdRegistration.id}`));
    } catch (err) {
      console.error("Error processing payment success:", err);
      setRegistrationError(err.message || "Payment was successful but there was an error updating your registration. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransferSubmit = async (paymentMethod, receiptUrl, referenceCode, details, bankInfo) => {
    setLoading(true);
    setRegistrationError(null);
    try {
      if (!createdRegistration) {
        throw new Error("No registration found to update.");
      }

      const paymentDetails = {
        additional_info: details,
        bank_account_used: {
          nickname: bankInfo.account_nickname,
          bank_name: bankInfo.bank_name,
          currency: bankInfo.currency
        }
      };

      const newPayment = await createPaymentRecord(createdRegistration, paymentMethod, 'pending_verification', referenceCode, receiptUrl, paymentDetails);

      await EventRegistration.update(createdRegistration.id, {
        status: 'pending_verification',
        payment_method: paymentMethod,
        proof_url: receiptUrl,
        transaction_id: referenceCode,
        payment_date: new Date().toISOString(),
        payment_id: newPayment.id,
      });

      navigate(createPageUrl(`EventRegistrationSuccess?registrationId=${createdRegistration.id}`));
    } catch (err) {
      console.error("Error processing bank transfer:", err);
      setRegistrationError(err.message || "Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-700">{getText('Loading event details...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{getText('Error Loading Event')}</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link to={createPageUrl('Events')}>
            <Button>{getText('Back to Events')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const eventStart = new Date(event.start);
  const isPastEvent = eventStart < now;

  if (isPastEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">{getText('Registration Closed')}</h2>
          <p className="text-gray-600 mb-4">{getText('Registration for this event has closed.')}</p>
          <Link to={createPageUrl('Events')}>
            <Button>{getText('Back to Events')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-8">
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 sm:p-8 border-b">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{event.title}</h2>
            <div className="flex items-center gap-4 text-gray-600 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(event.start), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
            {registrationError && (
              <Alert variant="destructive" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>{registrationError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Step 1: Tier Selection */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold mb-4">{getText('Select Registration Type')}</h3>
              <RadioGroup
                value={selectedTier?.key || ''}
                onValueChange={(value) => setSelectedTier(event.registration_tiers.find(t => t.key === value))}
                className="space-y-4"
              >
                {event.registration_tiers && event.registration_tiers.length > 0 ? (
                  event.registration_tiers.map((tier) => (
                    <div key={tier.key} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50">
                      <RadioGroupItem value={tier.key} id={tier.key} className="flex-shrink-0" />
                      <Label htmlFor={tier.key} className="flex flex-col flex-grow cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{tier.name}</h3>
                            {tier.description && (
                              <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">${tier.price_usd}</div>
                            <div className="text-sm text-gray-500">{getText('USD')}</div>
                          </div>
                        </div>
                        {tier.benefits && tier.benefits.length > 0 && (
                          <ul className="mt-3 space-y-1 text-sm text-gray-700">
                            {tier.benefits.map((benefit, bIndex) => (
                              <li key={bIndex} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Label>
                    </div>
                  ))
                ) : (
                  <Alert>
                    <AlertDescription>{getText('Registration options are not available for this event.')}</AlertDescription>
                  </Alert>
                )}
              </RadioGroup>
              <Button onClick={() => setCurrentStep(2)} disabled={!selectedTier || loading} className="w-full mt-6">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : getText('Next')}
              </Button>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {currentStep === 2 && selectedTier && (
            <div className="p-6 sm:p-8">
              <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                <ChevronLeft className="w-4 h-4" /> {getText('Back to options')}
              </button>
              <h3 className="text-xl font-semibold mb-4">{getText('Your Information')}</h3>
              <DynamicRegistrationForm
                event={event}
                selectedTier={selectedTier}
                currentUser={currentUser}
                onRegistrationComplete={(registration) => {
                  setCreatedRegistration(registration);
                  setCurrentStep(3);
                  setLoading(false);
                }}
                fxRate={fxRate}
              />
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && createdRegistration && (
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold mb-4">Complete Your Payment</h3>
              <p className="text-gray-600 mb-6">
                Your registration for <span className="font-semibold">{createdRegistration.contact_name || createdRegistration.organization_name || 'this event'}</span> is being held. Please complete the payment to confirm your spot.
              </p>
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <Info className="w-5 h-5 mr-2" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-lg font-semibold text-gray-800 mb-2">
                    <span>Amount Due (USD):</span>
                    <span>${selectedTier.price_usd.toFixed(2)}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Amount Due (CAD Approx.):</span>
                    <span>${(selectedTier.price_usd * fxRate).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <SharedPaymentGateway
                amountUSD={selectedTier.price_usd}
                amountCAD={selectedTier.price_usd * fxRate}
                itemDescription={`${event.title} - ${selectedTier.name} Registration`}
                relatedEntityId={createdRegistration.id}
                relatedEntityType="event_registration"
                payerName={createdRegistration.contact_name}
                payerEmail={createdRegistration.contact_email}
                onCardPaymentSuccess={handlePaymentSuccess}
                onBankTransferInitiated={handleBankTransferSubmit}
                onProcessing={() => setLoading(true)}
              />
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(2)}
                className="w-full mt-4 flex items-center justify-center text-gray-600"
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back to Information
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
