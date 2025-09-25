import React from 'react'

const UserCredentialsCard = ({ userData }) => {
  if (!userData) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 mx-6 mb-6 rounded-xl p-4 border border-blue-100">
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900 font-mono">{userData.email}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Mot de passe temporaire</p>
            <p className="text-sm text-gray-900 font-mono">{userData.tempPassword}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserCredentialsCard

