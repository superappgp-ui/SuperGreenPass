
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User } from '@/api/entities';
import { Agent } from '@/api/entities';
import { Tutor } from '@/api/entities';
import { SchoolProfile } from '@/api/entities';
import { Vendor } from '@/api/entities';
import UserProfileForm from '../components/profile/UserProfileForm';
import AgentProfileForm from '../components/profile/AgentProfileForm';
import TutorProfileForm from '../components/profile/TutorProfileForm';
import SchoolProfileForm from '../components/profile/SchoolProfileForm';
import VendorProfileForm from '../components/profile/VendorProfileForm';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [roleSpecificData, setRoleSpecificData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form data state
  const [userFormData, setUserFormData] = useState({});
  const [roleFormData, setRoleFormData] = useState({});

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setUserFormData(user); // Initialize form data with user data

        // Load role-specific data
        let roleData = null;
        switch (user.user_type) {
          case 'agent':
            try {
              const agentData = await Agent.filter({ user_id: user.id });
              roleData = agentData.length > 0 ? agentData[0] : null;
            } catch (err) {
              console.warn('No agent data found:', err);
            }
            break;
          case 'tutor':
            try {
              const tutorData = await Tutor.filter({ user_id: user.id });
              roleData = tutorData.length > 0 ? tutorData[0] : null;
            } catch (err) {
              console.warn('No tutor data found:', err);
            }
            break;
          case 'school':
            try {
              const schoolData = await SchoolProfile.filter({ user_id: user.id });
              roleData = schoolData.length > 0 ? schoolData[0] : null;
            } catch (err) {
              console.warn('No school data found:', err);
            }
            break;
          case 'vendor':
            try {
              const vendorData = await Vendor.filter({ user_id: user.id });
              roleData = vendorData.length > 0 ? vendorData[0] : null;
            } catch (err) {
              console.warn('No vendor data found:', err);
            }
            break;
        }
        setRoleSpecificData(roleData);
        setRoleFormData(roleData || {}); // Initialize role form data
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load profile data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Handle input changes for user form
  const handleUserInputChange = (field, value) => {
    setUserFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle input changes for role-specific form
  const handleRoleInputChange = (field, value) => {
    setRoleFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save user profile
  const handleSaveUserProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      // Update user data
      const updatedUser = await User.updateMyUserData(userFormData);
      setCurrentUser(updatedUser);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error("Error saving user profile:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Save role-specific profile
  const handleSaveRoleProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      let savedData = null;
      const userId = currentUser.id;
      
      switch (currentUser.user_type) {
        case 'agent':
          if (roleSpecificData) {
            savedData = await Agent.update(roleSpecificData.id, roleFormData);
          } else {
            // Client-side validation for new agents
            if (!roleFormData.company_name || !roleFormData.business_license_mst || !roleFormData.paypal_email) {
              setError("Please fill all required fields: Company Name, Business License, and PayPal Email.");
              setSaving(false);
              return;
            }
            const agentDataWithReferralCode = {
              ...roleFormData,
              user_id: userId,
              referral_code: `AG${Date.now().toString().slice(-6)}`
            };
            savedData = await Agent.create(agentDataWithReferralCode);
          }
          break;
        case 'tutor':
          if (roleSpecificData) {
            savedData = await Tutor.update(roleSpecificData.id, roleFormData);
          } else {
            // Client-side validation for new tutors
            if (!roleFormData.experience_years || !roleFormData.hourly_rate || !roleFormData.specializations?.length || !roleFormData.paypal_email) {
              setError("Please fill all required fields for the tutor profile.");
              setSaving(false);
              return;
            }
            savedData = await Tutor.create({ ...roleFormData, user_id: userId });
          }
          break;
        case 'school':
          if (roleSpecificData) {
            savedData = await SchoolProfile.update(roleSpecificData.id, roleFormData);
          } else {
            // Client-side validation for new schools
            if (!roleFormData.name || !roleFormData.school_level || !roleFormData.location) {
              setError("Please fill all required fields: School Name, Level, and Location.");
              setSaving(false);
              return;
            }
            savedData = await SchoolProfile.create({ ...roleFormData, user_id: userId });
          }
          break;
        case 'vendor':
          if (roleSpecificData) {
            savedData = await Vendor.update(roleSpecificData.id, roleFormData);
          } else {
            // Client-side validation for new vendors
            if (!roleFormData.business_name || !roleFormData.service_categories?.length || !roleFormData.paypal_email) {
              setError("Please fill all required fields: Business Name, Service Categories, and PayPal Email.");
              setSaving(false);
              return;
            }
            savedData = await Vendor.create({ ...roleFormData, user_id: userId });
          }
          break;
      }
      
      setRoleSpecificData(savedData);
      setRoleFormData(savedData);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error("Error saving role-specific profile:", error);
      setError("Failed to save professional profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences.</p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="professional">Professional Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <UserProfileForm 
                  formData={userFormData}
                  handleInputChange={handleUserInputChange}
                />
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handleSaveUserProfile}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {currentUser.user_type === 'agent' && (
                  <AgentProfileForm 
                    formData={roleFormData}
                    handleInputChange={handleRoleInputChange}
                  />
                )}
                {currentUser.user_type === 'tutor' && (
                  <TutorProfileForm 
                    formData={roleFormData}
                    handleInputChange={handleRoleInputChange}
                  />
                )}
                {currentUser.user_type === 'school' && (
                  <SchoolProfileForm 
                    formData={roleFormData}
                    handleInputChange={handleRoleInputChange}
                  />
                )}
                {currentUser.user_type === 'vendor' && (
                  <VendorProfileForm 
                    formData={roleFormData}
                    handleInputChange={handleRoleInputChange}
                  />
                )}
                {['user', 'student'].includes(currentUser.user_type) && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Professional profile settings are available after selecting a professional role.
                    </p>
                  </div>
                )}
                
                {!['user', 'student'].includes(currentUser.user_type) && (
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={handleSaveRoleProfile}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
