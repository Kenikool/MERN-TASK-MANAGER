import React, { createContext, useContext, useState } from 'react'
import { useSubscription } from './SubscriptionContext'
import { aiAPI } from '../utils/api'
import toast from 'react-hot-toast'

const AIContext = createContext()

export const AIProvider = ({ children }) => {
  const { canUseFeature, getRemainingUsage } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [aiUsage, setAiUsage] = useState(0)

  // AI Features
  const generateTaskSuggestions = async (projectContext, userPreferences = {}) => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.generateTaskSuggestions({
        projectContext,
        userPreferences
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.suggestions
    } catch (error) {
      toast.error('Failed to generate task suggestions')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const optimizeTaskSchedule = async (tasks, constraints = {}) => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.optimizeSchedule({
        tasks,
        constraints
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.optimizedSchedule
    } catch (error) {
      toast.error('Failed to optimize schedule')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateProjectInsights = async (projectId, timeframe = '30d') => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.generateInsights({
        projectId,
        timeframe
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.insights
    } catch (error) {
      toast.error('Failed to generate insights')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const improveTaskDescription = async (taskTitle, currentDescription = '') => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.improveDescription({
        title: taskTitle,
        description: currentDescription
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.improvedDescription
    } catch (error) {
      toast.error('Failed to improve description')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const estimateTaskDuration = async (taskDescription, complexity = 'medium') => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.estimateDuration({
        description: taskDescription,
        complexity
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.estimation
    } catch (error) {
      toast.error('Failed to estimate duration')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateMeetingNotes = async (meetingTranscript, participants = []) => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.generateMeetingNotes({
        transcript: meetingTranscript,
        participants
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.notes
    } catch (error) {
      toast.error('Failed to generate meeting notes')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const analyzeProductivity = async (userId, timeframe = '7d') => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.analyzeProductivity({
        userId,
        timeframe
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.analysis
    } catch (error) {
      toast.error('Failed to analyze productivity')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateReportSummary = async (reportData, reportType = 'general') => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.generateReportSummary({
        data: reportData,
        type: reportType
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.summary
    } catch (error) {
      toast.error('Failed to generate report summary')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const smartTaskPrioritization = async (tasks, userGoals = []) => {
    if (!canUseFeature('aiRequests', aiUsage)) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return null
    }

    try {
      setLoading(true)
      const response = await aiAPI.prioritizeTasks({
        tasks,
        goals: userGoals
      })
      
      setAiUsage(prev => prev + 1)
      return response.data.prioritizedTasks
    } catch (error) {
      toast.error('Failed to prioritize tasks')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getRemainingAIRequests = () => {
    return getRemainingUsage('aiRequests', aiUsage)
  }

  const canUseAI = () => {
    return canUseFeature('aiRequests', aiUsage)
  }

  const value = {
    loading,
    aiUsage,
    generateTaskSuggestions,
    optimizeTaskSchedule,
    generateProjectInsights,
    improveTaskDescription,
    estimateTaskDuration,
    generateMeetingNotes,
    analyzeProductivity,
    generateReportSummary,
    smartTaskPrioritization,
    getRemainingAIRequests,
    canUseAI
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIProvider')
  }
  return context
}

export default AIContext