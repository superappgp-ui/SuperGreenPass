
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Agent } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Star,
  Globe,
  Languages,
  ShieldCheck,
  MessageCircle,
  UserCheck,
  AlertCircle
} from "lucide-react";

// Helper function to validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// A simple helper function to create page URLs.
// In a real application, this would likely be imported from a utility file
// or replaced with a routing library's navigation function (e.g., useRouter from Next.js).
const createPageUrl = (pageName) => {
  switch (pageName) {
    case 'Welcome':
      return '/welcome';
    // Add other cases as needed for your application's routing
    default:
      return `/${pageName.toLowerCase()}`;
  }
};


const AgentCard = ({ agent, onSelectAgent, isSelecting, currentUser }) => {
  const showSelectAgentButton = !currentUser?.assigned_agent_id;
  const isCurrentlySelecting = isSelecting === agent.id;

  return (
    <Card className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
      <CardContent className="p-6 flex-grow flex flex-col">
        <div className="flex items-start gap-4">
          <img
            src={agent.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${agent.full_name || agent.company_name || 'A'}`}
            alt={agent.full_name || 'Agent'}
            className="w-20 h-20 rounded-full border-4 border-white shadow-md"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{agent.company_name || 'Education Agency'}</h3>
            <p className="text-gray-600 text-sm">{agent.full_name || 'Agent Representative'}</p>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-emerald-600">Verified Agent</span>
            </div>
          </div>
        </div>
        <div className="my-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Target Countries:</p>
          <div className="flex flex-wrap gap-2">
            {(agent.target_countries || ['Canada']).map(country => (
              <Badge key={country} variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {country}
              </Badge>
            ))}
          </div>
        </div>
        <div className="my-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Languages Spoken:</p>
          <div className="flex flex-wrap gap-2">
            {(agent.team_details?.languages_spoken || ['English']).map(lang => (
              <Badge key={lang} variant="outline">{lang}</Badge>
            ))}
          </div>
        </div>
        <div className="flex-grow"></div>
        <div className="border-t pt-4 mt-4">
          {showSelectAgentButton ? (
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
              onClick={() => onSelectAgent(agent)}
              disabled={isCurrentlySelecting}
            >
              {isCurrentlySelecting ? 'Selecting...' : 'Select This Agent'}
            </Button>
          ) : (
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white" disabled>
              <MessageCircle className="w-4 h-4 mr-2" /> Contact Agent
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function FindAgent() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ country: 'all', language: 'all' });
  const [currentUser, setCurrentUser] = useState(null);
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [agentUsers, setAgentUsers] = useState({});
  const [selectingAgent, setSelectingAgent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        // If user already has an assigned agent, fetch and display it
        if (user && user.assigned_agent_id && isValidObjectId(user.assigned_agent_id)) {
          try {
            const assignedAgentData = await Agent.filter({ id: user.assigned_agent_id });
            if (assignedAgentData.length > 0) {
              setAssignedAgent(assignedAgentData[0]);
              
              // Try to get the user info for the assigned agent if valid ID
              if (assignedAgentData[0].user_id && isValidObjectId(assignedAgentData[0].user_id)) {
                try {
                  const agentUserData = await User.filter({ id: assignedAgentData[0].user_id });
                  if (agentUserData.length > 0) {
                    setAgentUsers(prev => ({
                      ...prev,
                      [assignedAgentData[0].user_id]: agentUserData[0]
                    }));
                  }
                } catch (userError) {
                  console.warn("Could not load assigned agent user data:", userError);
                }
              }
            }
          } catch (agentError) {
            console.warn("Could not load assigned agent:", agentError);
          }
        }

        // Load all verified agents from the Agent entity
        const agentProfiles = await Agent.filter({ verification_status: 'verified' });

        // Filter out agents with invalid user_ids and prepare combined data
        let combinedAgents = [];
        
        for (const agentProfile of agentProfiles) {
          // Create a combined agent object with agent data
          let combinedAgent = {
            ...agentProfile,
            full_name: 'Agent Representative', // Default fallback
            email: 'contact@agency.com' // Default fallback
          };

          // Try to get user data if user_id is valid
          if (agentProfile.user_id && isValidObjectId(agentProfile.user_id)) {
            try {
              const userData = await User.filter({ id: agentProfile.user_id });
              if (userData.length > 0) {
                const user = userData[0];
                combinedAgent = {
                  ...agentProfile,
                  full_name: user.full_name || 'Agent Representative',
                  email: user.email || 'contact@agency.com',
                  profile_picture: user.profile_picture
                };
                
                // Store user data for later reference
                setAgentUsers(prev => ({
                  ...prev,
                  [agentProfile.user_id]: user
                }));
              }
            } catch (userError) {
              console.warn(`Could not load user data for agent ${agentProfile.id}:`, userError);
              // Continue with agent data only
            }
          }
          
          combinedAgents.push(combinedAgent);
        }

        setAgents(combinedAgents);
        setFilteredAgents(combinedAgents);
      } catch (error) {
        console.error("Error loading agents:", error);
        setError("Failed to load agents. Please try again later.");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    let currentAgentsToFilter = agents;
    // If a user has an assigned agent, remove that agent from the selectable list
    if (currentUser?.assigned_agent_id) {
      currentAgentsToFilter = agents.filter(agent => agent.id !== currentUser.assigned_agent_id);
    }

    let filtered = currentAgentsToFilter;
    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.country !== 'all') {
      filtered = filtered.filter(agent => agent.target_countries?.includes(filters.country));
    }
    if (filters.language !== 'all') {
      filtered = filtered.filter(agent => agent.team_details?.languages_spoken?.includes(filters.language));
    }
    setFilteredAgents(filtered);
  }, [agents, searchTerm, filters, currentUser]);

  const handleSelectAgent = async (agent) => {
    // First check if user is logged in
    if (!currentUser) {
      // Redirect to welcome page if not logged in
      window.location.href = createPageUrl('Welcome');
      return;
    }

    if (currentUser && currentUser.assigned_agent_id) {
      alert("You already have an assigned agent. Please contact support if you need to change your agent.");
      return;
    }

    setSelectingAgent(agent.id);
    try {
      // Assign the agent to the current user
      await User.updateMyUserData({
        assigned_agent_id: agent.id
      });

      // Refresh user data to reflect the change
      const updatedUser = await User.me();
      setCurrentUser(updatedUser);
      setAssignedAgent(agent);

      alert("Agent assigned successfully! They will be notified and will contact you soon.");
    } catch (error) {
      console.error("Error selecting agent:", error);
      alert("Failed to assign agent. Please try again.");
    } finally {
      setSelectingAgent(null);
    }
  };

  const handleRequestReassignment = () => {
    const reason = prompt("Please explain why you want to change your agent:");
    if (!reason) {
      alert("Agent reassignment request cancelled.");
      return;
    }

    console.log("Reassignment request reason:", reason);
    alert("Your reassignment request has been submitted to admin for review. You will be contacted shortly.");
  };

  // Generate unique countries and languages for filters
  const uniqueCountries = [...new Set(agents.flatMap(a => a.target_countries || []))];
  const uniqueLanguages = [...new Set(agents.flatMap(a => a.team_details?.languages_spoken || []))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Agents</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {currentUser?.assigned_agent_id ? "Your Assigned Agent" : "Find Your Agent"}
          </h1>
          <p className="text-gray-600 text-lg">
            {currentUser?.assigned_agent_id
              ? "Your dedicated agent will guide you through your immigration journey."
              : "Choose a trusted agent to guide your immigration journey"
            }
          </p>
        </div>

        {/* Show assigned agent if exists and current user has one */}
        {assignedAgent && currentUser?.assigned_agent_id && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <UserCheck className="w-6 h-6" />
                Assigned Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={agentUsers[assignedAgent.user_id]?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${agentUsers[assignedAgent.user_id]?.full_name || assignedAgent.company_name || 'A'}`}
                  alt={agentUsers[assignedAgent.user_id]?.full_name || 'Assigned Agent'}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{assignedAgent.company_name || 'Education Agency'}</h3>
                  <p className="text-gray-600">{agentUsers[assignedAgent.user_id]?.full_name || 'Agent Representative'}</p>
                  <p className="text-sm text-gray-500">{agentUsers[assignedAgent.user_id]?.email || 'contact@agency.com'}</p>
                </div>
                <div className="text-right">
                  <Button
                    variant="outline"
                    onClick={handleRequestReassignment}
                    className="text-orange-600 hover:bg-orange-50"
                  >
                    Request Change
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Admin approval required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show available agents for selection ONLY if no agent is assigned */}
        {!currentUser?.assigned_agent_id && (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 grid lg:grid-cols-4 gap-6 items-center">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  placeholder="Search by name or company..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 h-12 text-lg" 
                />
              </div>
              <Select value={filters.country} onValueChange={v => setFilters(p => ({ ...p, country: v }))}>
                <SelectTrigger className="h-12">
                  <Globe className="w-4 h-4 mr-2" />Country
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.language} onValueChange={v => setFilters(p => ({ ...p, language: v }))}>
                <SelectTrigger className="h-12">
                  <Languages className="w-4 h-4 mr-2" />Language
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAgents.length === 0 && (searchTerm !== "" || filters.country !== "all" || filters.language !== "all") ? (
                <p className="text-gray-600 lg:col-span-3">No agents found matching your criteria.</p>
              ) : filteredAgents.length === 0 ? (
                <p className="text-gray-600 lg:col-span-3">No agents available for selection at this moment.</p>
              ) : (
                filteredAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onSelectAgent={handleSelectAgent}
                    isSelecting={selectingAgent}
                    currentUser={currentUser}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
