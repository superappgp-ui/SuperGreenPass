
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
// NOTE: Role-specific entities are now imported dynamically
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, User as UserIcon, Briefcase, BookOpen, Building, Store, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { completeOnboardingProcess } from '../components/utils/onboardingService'; // Corrected import path

const STEPS = {
  CHOOSE_ROLE: 'choose_role',
  BASIC_INFO: 'basic_info',
  ROLE_SPECIFIC: 'role_specific',
  COMPLETE: 'complete'
};

const ROLE_OPTIONS = [
  {
    type: 'user',
    title: 'Student',
    subtitle: 'I want to study abroad',
    description: 'Find schools, get visa help, connect with tutors, and manage your study abroad journey',
    icon: <UserIcon className="w-8 h-8" />,
    color: 'bg-blue-500',
    benefits: ['Access to thousands of programs', 'Free counselor matching', 'Visa application support', 'Test prep resources']
  },
  {
    type: 'agent',
    title: 'Education Agent',
    subtitle: 'I help students study abroad',
    description: 'Connect with students, manage applications, earn commissions, and grow your agency',
    icon: <Briefcase className="w-8 h-8" />,
    color: 'bg-purple-500',
    benefits: ['Student referral system', 'Commission tracking', 'Case management tools', 'Marketing support']
  },
  {
    type: 'tutor',
    title: 'Tutor',
    subtitle: 'I teach test prep & languages',
    description: 'Offer tutoring services, manage sessions, earn income teaching students',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'bg-green-500',
    benefits: ['Online session platform', 'Student matching', 'Payment processing', 'Schedule management']
  },
  {
    type: 'school',
    title: 'Educational Institution',
    subtitle: 'I represent a school/college',
    description: 'Promote programs, connect with students, manage applications and enrollments',
    icon: <Building className="w-8 h-8" />,
    color: 'bg-indigo-500',
    benefits: ['Program listings', 'Student inquiries', 'Application management', 'Marketing tools']
  },
  {
    type: 'vendor',
    title: 'Service Provider',
    subtitle: 'I offer student services',
    description: 'Provide services like transport, SIM cards, accommodation to international students',
    icon: <Store className="w-8 h-8" />,
    color: 'bg-orange-500',
    benefits: ['Service marketplace', 'Order management', 'Payment processing', 'Customer reviews']
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(STEPS.CHOOSE_ROLE);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        // Pre-fill form data with existing user info
        setFormData({
          full_name: currentUser.full_name || '',
          phone: currentUser.phone || '',
          country: currentUser.country || '',
          email: currentUser.email || ''
        });
        
        // If user has already completed onboarding, redirect to dashboard
        if (currentUser.onboarding_completed) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // If user is not authenticated, redirect to welcome page
        navigate(createPageUrl('Welcome'));
      }
    };

    fetchUser();
  }, [navigate]);

  const getStepProgress = () => {
    const stepMap = {
      [STEPS.CHOOSE_ROLE]: 25,
      [STEPS.BASIC_INFO]: 50,
      [STEPS.ROLE_SPECIFIC]: 75,
      [STEPS.COMPLETE]: 100
    };
    return stepMap[currentStep] || 0;
  };

  const handleRoleSelect = (roleType) => {
    setSelectedRole(roleType);
    setCurrentStep(STEPS.BASIC_INFO);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBasicInfoSubmit = () => {
    setCurrentStep(STEPS.ROLE_SPECIFIC);
  };

  const handleBack = () => {
    if (currentStep === STEPS.BASIC_INFO) {
      setCurrentStep(STEPS.CHOOSE_ROLE);
    } else if (currentStep === STEPS.ROLE_SPECIFIC) {
      setCurrentStep(STEPS.BASIC_INFO);
    }
  };

  const validateBasicInfo = () => {
    return formData.full_name && formData.phone && formData.country;
  };

  const validateRoleSpecificInfo = () => {
    if (selectedRole === 'user') return true;
    
    if (selectedRole === 'agent') {
      return formData.company_name && formData.business_license_mst && formData.paypal_email;
    }
    
    if (selectedRole === 'tutor') {
      return formData.specializations && formData.experience_years && formData.hourly_rate && formData.paypal_email;
    }
    
    if (selectedRole === 'school') {
      return formData.school_name && formData.location && formData.website && formData.type;
    }
    
    if (selectedRole === 'vendor') {
      return formData.business_name && formData.service_categories?.length > 0 && formData.paypal_email;
    }
    
    return false;
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // Call the service function to handle all onboarding logic
      await completeOnboardingProcess(user, selectedRole, formData);

      setCurrentStep(STEPS.COMPLETE);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 2500);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderChooseRole = () => (
    <div className="text-center max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Welcome to GreenPass!</h1>
        <p className="text-lg text-gray-600">Choose your role to get started with your personalized experience</p>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {ROLE_OPTIONS.map((role) => (
          <Card 
            key={role.type} 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500 hover:scale-105 group"
            onClick={() => handleRoleSelect(role.type)}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`${role.color} text-white p-4 rounded-full mb-4 mx-auto w-fit group-hover:scale-110 transition-transform`}>
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
                <p className="text-sm font-medium text-green-600 mb-3">{role.subtitle}</p>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{role.description}</p>
                <div className="space-y-2">
                  {role.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center text-xs text-gray-500">
                      <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderBasicInfo = () => {
    const selectedRoleData = ROLE_OPTIONS.find(r => r.type === selectedRole);
    
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className={`${selectedRoleData?.color} text-white p-3 rounded-full mb-4 mx-auto w-fit`}>
            {selectedRoleData?.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
          <p className="text-gray-600">Setting up your {selectedRoleData?.title} profile</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name || ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={formData.email || ''}
              disabled
              className="mt-1 bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">This is your login email and cannot be changed</p>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Enter your country"
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleBasicInfoSubmit} 
              className="flex-1"
              disabled={!validateBasicInfo()}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderRoleSpecific = () => {
    const selectedRoleData = ROLE_OPTIONS.find(r => r.type === selectedRole);
    
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className={`${selectedRoleData?.color} text-white p-3 rounded-full mb-4 mx-auto w-fit`}>
            {selectedRoleData?.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your {selectedRoleData?.title} Profile
          </h2>
          <p className="text-gray-600">Just a few more details to get started</p>
        </div>
        
        <div className="space-y-6">
          {selectedRole === 'agent' && (
            <>
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Your education consultancy name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="business_license_mst">Business License (MST) *</Label>
                <Input
                  id="business_license_mst"
                  value={formData.business_license_mst || ''}
                  onChange={(e) => handleInputChange('business_license_mst', e.target.value)}
                  placeholder="Enter your business license number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="year_established">Year Established</Label>
                <Input
                  id="year_established"
                  type="number"
                  value={formData.year_established || ''}
                  onChange={(e) => handleInputChange('year_established', e.target.value)}
                  placeholder="2020"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="paypal_email">PayPal Email *</Label>
                <Input
                  id="paypal_email"
                  type="email"
                  value={formData.paypal_email || ''}
                  onChange={(e) => handleInputChange('paypal_email', e.target.value)}
                  placeholder="payouts@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Required for commission payouts</p>
              </div>
            </>
          )}

          {selectedRole === 'tutor' && (
            <>
              <div>
                <Label htmlFor="specializations">Specializations *</Label>
                <Input
                  id="specializations"
                  value={formData.specializations || ''}
                  onChange={(e) => handleInputChange('specializations', e.target.value)}
                  placeholder="IELTS, TOEFL, General English"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple specializations with commas</p>
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience *</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years || ''}
                  onChange={(e) => handleInputChange('experience_years', e.target.value)}
                  placeholder="5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate (USD) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate || ''}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                  placeholder="25.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell students about your teaching experience and approach..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="paypal_email">PayPal Email *</Label>
                <Input
                  id="paypal_email"
                  type="email"
                  value={formData.paypal_email || ''}
                  onChange={(e) => handleInputChange('paypal_email', e.target.value)}
                  placeholder="payouts@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Required for session payouts</p>
              </div>
            </>
          )}

          {selectedRole === 'school' && (
            <>
              <div>
                <Label htmlFor="school_name">Institution Name *</Label>
                <Input
                  id="school_name"
                  value={formData.school_name || ''}
                  onChange={(e) => handleInputChange('school_name', e.target.value)}
                  placeholder="e.g., University of Toronto"
                  className="mt-1"
                />
              </div>
               <div>
                <Label htmlFor="type">School Type *</Label>
                <Select value={formData.type || ''} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select institution type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="High School">High School</SelectItem>
                        <SelectItem value="College">College</SelectItem>
                        <SelectItem value="University">University</SelectItem>
                        <SelectItem value="Institute">Institute</SelectItem>
                        <SelectItem value="Vocational">Vocational School</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">City/Location *</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Toronto, ON"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="website">Official Website *</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.university.edu"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="about">About Your Institution</Label>
                <Textarea
                  id="about"
                  value={formData.about || ''}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  placeholder="Brief description of your institution..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </>
          )}

          {selectedRole === 'vendor' && (
            <>
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name || ''}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Your business name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Service Categories *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Transport", "SIM Card", "Banking", "Accommodation", "Delivery", "Tours"].map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={formData.service_categories?.includes(category) || false}
                        onChange={(e) => {
                          const current = formData.service_categories || [];
                          const updated = e.target.checked 
                            ? [...current, category]
                            : current.filter(c => c !== category);
                          handleInputChange('service_categories', updated);
                        }}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor={`category-${category}`} className="text-sm text-gray-700">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="paypal_email">PayPal Email *</Label>
                <Input
                  id="paypal_email"
                  type="email"
                  value={formData.paypal_email || ''}
                  onChange={(e) => handleInputChange('paypal_email', e.target.value)}
                  placeholder="payouts@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Required for service payouts</p>
              </div>
            </>
          )}

          {selectedRole === 'user' && (
            <div className="text-center py-8">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You're All Set!</h3>
              <p className="text-gray-600">
                As a student, you can start exploring programs, connecting with agents, and planning your study abroad journey.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleCompleteOnboarding}
              disabled={loading || !validateRoleSpecificInfo()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderComplete = () => (
    <div className="text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to GreenPass!</h2>
      <p className="text-gray-600 mb-6">Your account has been set up successfully. Get ready to start your journey!</p>
      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800">Redirecting to your personalized dashboard...</p>
      </div>
      <div className="flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-sm text-gray-600">
              Step {Object.keys(STEPS).indexOf(currentStep) + 1} of {Object.keys(STEPS).length}
            </div>
          </div>
          <Progress value={getStepProgress()} className="h-2 w-full max-w-md mx-auto" />
        </div>

        <Card className="p-6 sm:p-8 lg:p-12 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            {currentStep === STEPS.CHOOSE_ROLE && renderChooseRole()}
            {currentStep === STEPS.BASIC_INFO && renderBasicInfo()}
            {currentStep === STEPS.ROLE_SPECIFIC && renderRoleSpecific()}
            {currentStep === STEPS.COMPLETE && renderComplete()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
