import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Tutor } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timezones = [
  'America/Toronto',
  'America/Vancouver',
  'America/New_York',
  'Europe/London',
  'Asia/Ho_Chi_Minh',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const TimeSlot = ({ slot, onUpdate, onDelete }) => (
  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
    <div className="flex-1 grid grid-cols-3 gap-2">
      <Select value={slot.day} onValueChange={(value) => onUpdate({ ...slot, day: value })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {days.map(day => (
            <SelectItem key={day} value={day}>{day}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        type="time"
        value={slot.start_time}
        onChange={(e) => onUpdate({ ...slot, start_time: e.target.value })}
      />
      
      <Input
        type="time"
        value={slot.end_time}
        onChange={(e) => onUpdate({ ...slot, end_time: e.target.value })}
      />
    </div>
    
    <Button size="icon" variant="outline" onClick={onDelete}>
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);

export default function TutorAvailability() {
  const [user, setUser] = useState(null);
  const [tutorData, setTutorData] = useState(null);
  const [availability, setAvailability] = useState({
    timezone: 'America/Toronto',
    schedule: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser.user_type !== 'tutor') {
        setMessage({ type: 'error', text: 'Access denied. Only tutors can manage availability.' });
        return;
      }

      // Find tutor data
      const tutors = await Tutor.list();
      const tutor = tutors.find(t => t.user_id === currentUser.id);
      
      if (!tutor) {
        setMessage({ type: 'error', text: 'Tutor profile not found. Please complete your profile first.' });
        return;
      }

      setTutorData(tutor);
      
      // Load existing availability or set defaults
      if (tutor.availability) {
        setAvailability(tutor.availability);
      } else {
        setAvailability({
          timezone: 'America/Toronto',
          schedule: [
            { day: 'Monday', start_time: '09:00', end_time: '17:00' },
            { day: 'Tuesday', start_time: '09:00', end_time: '17:00' }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load availability data.' });
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    setAvailability(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { day: 'Monday', start_time: '09:00', end_time: '17:00' }
      ]
    }));
  };

  const updateTimeSlot = (index, updatedSlot) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.map((slot, i) => i === index ? updatedSlot : slot)
    }));
  };

  const deleteTimeSlot = (index) => {
    setAvailability(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      
      // Validate schedule
      if (availability.schedule.length === 0) {
        setMessage({ type: 'error', text: 'Please add at least one time slot.' });
        return;
      }

      // Check for overlapping slots
      const sortedSchedule = availability.schedule.sort((a, b) => {
        if (a.day !== b.day) {
          return days.indexOf(a.day) - days.indexOf(b.day);
        }
        return a.start_time.localeCompare(b.start_time);
      });

      // Update tutor availability
      await Tutor.update(tutorData.id, {
        availability: {
          ...availability,
          schedule: sortedSchedule
        }
      });
      
      setMessage({ type: 'success', text: 'Availability updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving availability:', error);
      setMessage({ type: 'error', text: 'Failed to save availability. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (message?.type === 'error' && !tutorData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          My Availability
        </h1>
        <p className="text-gray-600 mt-2">Manage your tutoring schedule and time zones</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Timezone Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label htmlFor="timezone">Your Time Zone</Label>
              <Select 
                value={availability.timezone} 
                onValueChange={(value) => setAvailability(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Schedule
              </CardTitle>
              <Button onClick={addTimeSlot} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {availability.schedule.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-600 px-3">
                  <span>Day</span>
                  <span>Start Time</span>
                  <span>End Time</span>
                </div>
                
                {availability.schedule.map((slot, index) => (
                  <TimeSlot
                    key={index}
                    slot={slot}
                    onUpdate={(updatedSlot) => updateTimeSlot(index, updatedSlot)}
                    onDelete={() => deleteTimeSlot(index)}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No time slots added yet.</p>
                <p className="text-sm">Click "Add Time Slot" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        {availability.schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {days.map(day => {
                  const daySlots = availability.schedule.filter(slot => slot.day === day);
                  return (
                    <div key={day} className="flex justify-between items-center p-2">
                      <span className="font-medium">{day}</span>
                      {daySlots.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {daySlots.map((slot, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {slot.start_time}-{slot.end_time}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not Available</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={saveAvailability} 
            disabled={saving || availability.schedule.length === 0}
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Availability
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}