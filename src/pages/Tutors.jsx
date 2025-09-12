
import React, { useState, useEffect } from "react";
import { Tutor } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Star,
  BookOpen,
  DollarSign,
  Filter,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TutorCard = ({ tutor, user }) => (
  <Card className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
    <CardContent className="p-6 flex-grow flex flex-col">
      <div className="flex items-start gap-4">
        <img
          src={user?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'Tutor'}`}
          alt={user?.full_name || 'Tutor'}
          className="w-20 h-20 rounded-full border-4 border-white shadow-md"
        />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{user?.full_name || 'Professional Tutor'}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-semibold">{tutor.rating || 4.5}</span>
            <span className="text-gray-500 text-sm">({tutor.total_students || 0} students)</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-gray-600 text-sm line-clamp-3 h-[60px]">{tutor.bio || 'Experienced tutor ready to help you achieve your goals.'}</p>
      </div>
      <div className="my-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Specializes in:</p>
        <div className="flex flex-wrap gap-2">
          {(tutor.specializations || ['IELTS']).map(spec => (
            <Badge key={spec} variant="secondary" className="bg-emerald-100 text-emerald-800">{spec}</Badge>
          ))}
        </div>
      </div>
      <div className="flex-grow"></div>
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Hourly Rate</span>
            <span className="text-xl font-bold text-emerald-600">${tutor.hourly_rate || 25}/hr</span>
        </div>
        <Link to={createPageUrl(`TutorDetails?id=${tutor.id}`)}>
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
                View Profile & Book
            </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

export default function Tutors() {
  const [tutors, setTutors] = useState([]);
  const [users, setUsers] = useState({});
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    specialization: 'all',
    rating: 'all',
    price: 'all'
  });

  // New state variables required for handleBookTutor functionality
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all tutors
        const tutorData = await Tutor.list();
        setTutors(tutorData);

        // Get user data for tutors - using a simple approach since we can't filter by ObjectId
        const allUsers = await User.list();
        const usersMap = allUsers.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        setUsers(usersMap);
      } catch (error) {
        console.error("Error loading tutors:", error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = tutors;

    if (searchTerm) {
        filtered = filtered.filter(tutor => {
            const user = users[tutor.user_id];
            return user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   tutor.bio?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }

    if (filters.specialization !== 'all') {
        filtered = filtered.filter(tutor =>
          tutor.specializations && tutor.specializations.includes(filters.specialization)
        );
    }

    if (filters.rating !== 'all') {
        filtered = filtered.filter(tutor => (tutor.rating || 0) >= parseInt(filters.rating));
    }

    if (filters.price !== 'all') {
        const [min, max] = filters.price.split('-').map(Number);
        filtered = filtered.filter(tutor =>
          tutor.hourly_rate >= min && (max ? tutor.hourly_rate <= max : true)
        );
    }

    setFilteredTutors(filtered);
  }, [tutors, users, searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBookTutor = async (tutor) => {
    try {
      // Check if user is logged in first
      await User.me();
      setSelectedTutor(tutor);
      setIsModalOpen(true);
    } catch (error) {
      // If not logged in, redirect to welcome page
      window.location.href = createPageUrl('Welcome');
    }
  };


  const specializations = [...new Set(tutors.flatMap(t => t.specializations || []))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Find Your Perfect Tutor
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Book sessions with verified experts for IELTS, TOEFL, and more.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select value={filters.specialization} onValueChange={(v) => handleFilterChange('specialization', v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Specialization" /><BookOpen className="w-4 h-4 mr-2" /> Specialization</SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {specializations.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.rating} onValueChange={(v) => handleFilterChange('rating', v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Min Rating" /><Star className="w-4 h-4 mr-2" /> Min Rating</SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="4">4 Stars & Up</SelectItem>
                        <SelectItem value="3">3 Stars & Up</SelectItem>
                        <SelectItem value="2">2 Stars & Up</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.price} onValueChange={(v) => handleFilterChange('price', v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Price/hr" /><DollarSign className="w-4 h-4 mr-2" /> Price/hr</SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="0-20">$0 - $20</SelectItem>
                        <SelectItem value="21-40">$21 - $40</SelectItem>
                        <SelectItem value="41-60">$41 - $60</SelectItem>
                        <SelectItem value="61-Infinity">$61+</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6 px-2 sm:px-0 text-sm">
            {loading ? "Loading tutors..." : `${filteredTutors.length} tutors found`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse p-6 space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                 </div>
                 <div className="h-3 bg-gray-200 rounded"></div>
                 <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </Card>
            ))}
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutors found</h3>
            <p className="text-gray-600">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} user={users[tutor.user_id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
