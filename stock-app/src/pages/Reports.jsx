import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { SalesStorage } from '../utils/salesStorage'
import { TransferStorage } from '../utils/transferStorage'
import { ReportGenerator } from '../utils/reportGenerator'
import Sidebar from '../components/Sidebar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Reports() {
  const { userProfile, isAdmin, logout } = useAuth()
  const { sidebarWidth } = useSidebar()
  const [selectedReport, setSelectedReport] = useState('sales')
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [selectedFormat, setSelectedFormat] = useState('excel')
  const [isGenerating, setIsGenerating] = useState(false)
  const [salesData, setSalesData] = useState([])
  const [transferData, setTransferData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const periods = [
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'yesterday', label: 'Hier' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
    { value: 'all', label: 'Tout le temps' }
  ]

  const formats = [
    { value: 'excel', label: 'Excel (CSV)', icon: '' },
    { value: 'pdf', label: 'PDF', icon: '' }
  ]

  useEffect(() => {
    loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile?.uid) return

    setIsLoading(true)
    try {
      // Charger les données de ventes
      const sales = await SalesStorage.getSales(userProfile.uid, isAdmin, 1000)
      setSalesData(sales)

      // Charger les données de transferts
      const transfers = await TransferStorage.getTransfers(userProfile.uid, isAdmin, 1000)
      setTransferData(transfers)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDataByPeriod = (data, period) => {
    if (period === 'all') return data

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thisYearStart = new Date(now.getFullYear(), 0, 1)

    return data.filter(item => {
      const itemDate = item.saleDate || item.created_at
      const date = itemDate.toDate ? itemDate.toDate() : new Date(itemDate)

      switch (period) {
        case 'today':
          return date >= today
        case 'yesterday':
          return date >= yesterday && date < today
        case 'week':
          return date >= oneWeekAgo
        case 'month':
          return date >= oneMonthAgo
        case 'year':
          return date >= thisYearStart
        default:
          return true
      }
    })
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      let dataToExport = []
      let reportName = ''

      if (selectedReport === 'sales') {
        dataToExport = filterDataByPeriod(salesData, selectedPeriod)
        reportName = 'ventes'
      } else {
        dataToExport = filterDataByPeriod(transferData, selectedPeriod)
        reportName = 'transferts'
      }

      if (dataToExport.length === 0) {
        alert('Aucune donnée trouvée pour la période sélectionnée.')
        setIsGenerating(false)
        return
      }

      if (selectedFormat === 'excel') {
        if (selectedReport === 'sales') {
          ReportGenerator.generateExcelReport(dataToExport, selectedPeriod)
        } else {
          ReportGenerator.generateTransferExcelReport(dataToExport, selectedPeriod)
        }
      } else {
        if (selectedReport === 'sales') {
          ReportGenerator.generatePDFReport(dataToExport, selectedPeriod, userProfile?.shopName || '')
        } else {
          ReportGenerator.generateTransferPDFReport(dataToExport, selectedPeriod, userProfile?.shopName || '')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      alert('Erreur lors de la génération du rapport')
    } finally {
      setIsGenerating(false)
    }
  }

  const getPeriodLabel = (period) => {
    return periods.find(p => p.value === period)?.label || period
  }

  const getFormatLabel = (format) => {
    return formats.find(f => f.value === format)?.label || format
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50">
      <Sidebar currentPage="reports" />
      <div className="transition-all duration-300 border-l border-gray-200" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-teal-100">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Générez et téléchargez vos rapports de ventes et transferts
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={logout}
                  className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-6 h-full flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration du Rapport</h2>
                
                {/* Type de Rapport */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type de Rapport</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reportType"
                        value="sales"
                        checked={selectedReport === 'sales'}
                        onChange={(e) => setSelectedReport(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <span className="text-gray-700">Rapport de Ventes</span>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reportType"
                        value="transfers"
                        checked={selectedReport === 'transfers'}
                        onChange={(e) => setSelectedReport(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <span className="text-gray-700">Historique des Transferts</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Période */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Période</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {periods.map(period => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Format */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Format de Téléchargement</label>
                  <div className="space-y-2">
                    {formats.map(format => (
                      <label key={format.value} className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={selectedFormat === format.value}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <span className="text-gray-700">{format.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bouton de Génération */}
                <div className="mt-auto">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full"
                  >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Générer le Rapport
                    </>
                  )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-6 h-full">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Aperçu du Rapport</h2>
                
                {/* Résumé */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Période</p>
                        <p className="text-lg font-semibold text-gray-900">{getPeriodLabel(selectedPeriod)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Format</p>
                        <p className="text-lg font-semibold text-gray-900">{getFormatLabel(selectedFormat)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Données</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedReport === 'sales' 
                            ? filterDataByPeriod(salesData, selectedPeriod).length
                            : filterDataByPeriod(transferData, selectedPeriod).length
                          } enregistrements
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détails du Rapport */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Détails du Rapport</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Type:</strong> {selectedReport === 'sales' ? 'Rapport de Ventes' : 'Historique des Transferts'}</p>
                    <p><strong>Période:</strong> {getPeriodLabel(selectedPeriod)}</p>
                    <p><strong>Format:</strong> {getFormatLabel(selectedFormat)}</p>
                    <p><strong>Nombre d'enregistrements:</strong> {
                      selectedReport === 'sales' 
                        ? filterDataByPeriod(salesData, selectedPeriod).length
                        : filterDataByPeriod(transferData, selectedPeriod).length
                    }</p>
                    <p><strong>Généré le:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                {/* Message d'information */}
                {filterDataByPeriod(selectedReport === 'sales' ? salesData : transferData, selectedPeriod).length === 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm text-yellow-800">
                          Aucune donnée trouvée pour la période sélectionnée. 
                          Vérifiez que vous avez des {selectedReport === 'sales' ? 'ventes' : 'transferts'} pour cette période.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}