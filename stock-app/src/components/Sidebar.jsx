import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Sidebar({ currentPage = 'dashboard', onPageChange }) {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { userProfile, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigation = (itemId) => {
    if (itemId === 'dashboard') {
      navigate('/')
    } else if (itemId === 'shops' && !isAdmin) {
      navigate('/mon-magasin')
    } else if (itemId === 'depots' && !isAdmin) {
      navigate('/mes-depots')
    } else if (itemId === 'sales' && !isAdmin) {
      navigate('/ventes')
    } else if (itemId === 'quotes-invoices' && !isAdmin) {
      navigate('/devis-factures')
    } else if (['users', 'shops', 'depots', 'tools'].includes(itemId)) {
      // Navigate to admin dashboard with the specific page
      navigate(`/admin?page=${itemId}`)
    } else if (onPageChange) {
      onPageChange(itemId)
    }
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      )
    }
  ]

  // Add shop-specific menu items for non-admin users
  if (!isAdmin) {
    // Add magasin page for shop users
    menuItems.splice(1, 0, {
      id: 'shops',
      label: 'Mon Magasin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    })

    // Add depots for shop users
    menuItems.splice(2, 0, {
      id: 'depots',
      label: 'Dépôts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    })

    // Add sales page for shop users
    menuItems.splice(3, 0, {
      id: 'sales',
      label: 'Ventes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    })

    // Add quotes and invoices page for shop users
    menuItems.splice(4, 0, {
      id: 'quotes-invoices',
      label: 'Devis & Factures',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    })
  }

  // Admin-only menu items
  if (isAdmin) {
    const adminMenuItems = [
      {
        id: 'users',
        label: 'Utilisateurs',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      },
      {
        id: 'shops',
        label: 'Magasins',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      },
      {
        id: 'depots',
        label: 'Dépôts',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        )
      }
    ]

    // Insert admin menu items after dashboard
    menuItems.splice(1, 0, ...adminMenuItems)

    // Add tools at the end
    menuItems.push({
      id: 'tools',
      label: 'Outils',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    })
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-white/90 backdrop-blur-sm border-r border-gray-300 shadow-lg transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo Section */}
      <div className="flex items-center justify-between p-3">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21l3-3 3 3" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                DukaPilote
              </h1>
              <p className="text-xs text-gray-600">
                {isAdmin ? 'Admin' : userProfile?.shopId ? 'Magasin' : 'Utilisateur'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-teal-600'}`}>
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <span className="ml-3 font-medium text-sm">
                      {item.label}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info Section */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-3 border border-teal-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                  isAdmin ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-teal-500 to-green-500'
                }`}>
                  {userProfile?.prenom ? userProfile.prenom.charAt(0).toUpperCase() + (userProfile?.nom ? userProfile.nom.charAt(0).toUpperCase() : '') : (userProfile?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.prenom ? `${userProfile.prenom}${userProfile?.nom ? ` ${userProfile.nom}` : ''}` : userProfile?.email?.split('@')[0] || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-600">
                  {isAdmin ? 'Administrateur' : 'Utilisateur Magasin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state tooltip */}
      {isCollapsed && (
        <div className="absolute bottom-4 left-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
            isAdmin ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-teal-500 to-green-500'
          }`}>
            {userProfile?.prenom ? userProfile.prenom.charAt(0).toUpperCase() + (userProfile?.nom ? userProfile.nom.charAt(0).toUpperCase() : '') : (userProfile?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  )
}