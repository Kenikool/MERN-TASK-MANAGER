import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'



export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'badge-success'
    case 'in-progress':
      return 'badge-primary'
    case 'todo':
      return 'badge-ghost'
    case 'review':
      return 'badge-info'
    case 'cancelled':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}


export function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent':
      return 'badge-error'
    case 'high':
      return 'badge-warning'
    case 'medium':
      return 'badge-info'
    case 'low':
      return 'badge-ghost'
    default:
      return 'badge-ghost'
  }
}

export function getRoleColor(role) {
  switch (role) {
    case 'admin':
      return 'badge-error'
    case 'manager':
      return 'badge-warning'
    case 'member':
      return 'badge-info'
    default:
      return 'badge-ghost'
  }
}


export function formatDate(date) {
  if (!date) return 'No date'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}


export function formatRelativeTime(date) {
  if (!date) return 'No date'
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = targetDate - now
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days overdue`
  } else if (diffInDays === 0) {
    return 'Due today'
  } else if (diffInDays === 1) {
    return 'Due tomorrow'
  } else {
    return `Due in ${diffInDays} days`
  }
}


export function isOverdue(date, status) {
  if (!date || status === 'completed') return false
  return new Date(date) < new Date()
}