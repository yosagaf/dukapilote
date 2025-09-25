import { SalesStorage } from './salesStorage'
import { TransferStorage } from './transferStorage'

export const ReportGenerator = {
  // Générer un rapport Excel (format CSV pour simplicité)
  generateExcelReport: (salesData, period = 'all') => {
    const exportData = SalesStorage.exportSalesData(salesData, 'excel')
    
    // Créer le contenu CSV
    const csvContent = [
      exportData.headers.join(','),
      ...exportData.rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      )
    ].join('\n')

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport_ventes_${period}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, filename: `rapport_ventes_${period}_${new Date().toISOString().split('T')[0]}.csv` }
  },

  // Générer un rapport Excel pour les transferts
  generateTransferExcelReport: (transferData, period = 'all') => {
    const exportData = TransferStorage.exportTransferData(transferData, 'excel')
    
    // Créer le contenu CSV
    const csvContent = [
      exportData.headers.join(','),
      ...exportData.rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      )
    ].join('\n')

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport_transferts_${period}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, filename: `rapport_transferts_${period}_${new Date().toISOString().split('T')[0]}.csv` }
  },

  // Générer un rapport PDF (format HTML pour impression)
  generatePDFReport: (salesData, period = 'all', shopName = '') => {
    const exportData = SalesStorage.exportSalesData(salesData, 'pdf')
    const stats = SalesStorage.getSalesStats('', salesData)
    
    // Créer le contenu HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Ventes - ${shopName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #F8FAFC;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4F46E5;
          }
          .stat-card h3 {
            margin: 0 0 10px 0;
            color: #4F46E5;
            font-size: 18px;
          }
          .stat-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1F2937;
          }
          .stat-card .label {
            color: #6B7280;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
          }
          th {
            background-color: #F3F4F6;
            font-weight: 600;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #F9FAFB;
          }
          .total-row {
            background-color: #4F46E5 !important;
            color: white;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport de Ventes</h1>
          <p>${shopName ? `Magasin: ${shopName}` : ''}</p>
          <p>Période: ${period === 'all' ? 'Toutes les ventes' : period}</p>
          <p>Généré le: ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total des Ventes</h3>
            <div class="value">${stats.allTime.count}</div>
            <div class="label">Nombre de ventes</div>
          </div>
          <div class="stat-card">
            <h3>Chiffre d'Affaires</h3>
            <div class="value">${stats.allTime.total.toLocaleString('fr-FR')} KMF</div>
            <div class="label">Total des ventes</div>
          </div>
          <div class="stat-card">
            <h3>Panier Moyen</h3>
            <div class="value">${stats.allTime.count > 0 ? (stats.allTime.total / stats.allTime.count).toLocaleString('fr-FR') : '0'} KMF</div>
            <div class="label">Par vente</div>
          </div>
        </div>

        <h2>Détail des Ventes</h2>
        <table>
          <thead>
            <tr>
              ${exportData.headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportData.rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4"><strong>TOTAL</strong></td>
              <td><strong>${stats.allTime.total.toLocaleString('fr-FR')} KMF</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Rapport généré automatiquement par DukaPilote</p>
          <p>© ${new Date().getFullYear()} - Système de Gestion de Stock</p>
        </div>
      </body>
      </html>
    `

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print()
    }
    
    return { success: true, filename: `rapport_ventes_${period}_${new Date().toISOString().split('T')[0]}.pdf` }
  },

  // Générer un rapport PDF pour les transferts
  generateTransferPDFReport: (transferData, period = 'all', shopName = '') => {
    const exportData = TransferStorage.exportTransferData(transferData, 'pdf')
    
    // Créer le contenu HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Transferts - ${shopName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #F8FAFC;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4F46E5;
          }
          .stat-card h3 {
            margin: 0 0 10px 0;
            color: #4F46E5;
            font-size: 18px;
          }
          .stat-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1F2937;
          }
          .stat-card .label {
            color: #6B7280;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
          }
          th {
            background-color: #F3F4F6;
            font-weight: 600;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #F9FAFB;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport de Transferts</h1>
          <p>${shopName ? `Magasin: ${shopName}` : ''}</p>
          <p>Période: ${period === 'all' ? 'Tous les transferts' : period}</p>
          <p>Généré le: ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <h3>Total des Transferts</h3>
            <div class="value">${transferData.length}</div>
            <div class="label">Nombre de transferts</div>
          </div>
          <div class="stat-card">
            <h3>Articles Transférés</h3>
            <div class="value">${transferData.reduce((sum, t) => sum + t.quantity, 0)}</div>
            <div class="label">Quantité totale</div>
          </div>
        </div>

        <h2>Détail des Transferts</h2>
        <table>
          <thead>
            <tr>
              ${exportData.headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportData.rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Rapport généré automatiquement par DukaPilote</p>
          <p>© ${new Date().getFullYear()} - Système de Gestion de Stock</p>
        </div>
      </body>
      </html>
    `

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print()
    }
    
    return { success: true, filename: `rapport_transferts_${period}_${new Date().toISOString().split('T')[0]}.pdf` }
  },

  // Générer un rapport de performance
  generatePerformanceReport: (salesData, period = 'month') => {
    const stats = SalesStorage.getSalesStats('', salesData)
    
    // Calculer les métriques de performance
    const performance = {
      totalSales: stats.allTime.count,
      totalRevenue: stats.allTime.total,
      averageOrderValue: stats.allTime.count > 0 ? stats.allTime.total / stats.allTime.count : 0,
      period: period,
      generatedAt: new Date()
    }

    // Créer le contenu du rapport
    const reportContent = {
      title: `Rapport de Performance - ${period}`,
      summary: {
        'Total des Ventes': `${performance.totalSales} ventes`,
        'Chiffre d\'Affaires': `${performance.totalRevenue.toLocaleString('fr-FR')} KMF`,
        'Panier Moyen': `${performance.averageOrderValue.toLocaleString('fr-FR')} KMF`,
        'Période': period,
        'Généré le': performance.generatedAt.toLocaleDateString('fr-FR')
      }
    }

    return reportContent
  },

  // Exporter les données pour analyse externe
  exportForAnalysis: (salesData) => {
    const analysisData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: salesData.length,
        dateRange: {
          start: salesData.length > 0 ? 
            Math.min(...salesData.map(s => new Date(s.saleDate).getTime())) : null,
          end: salesData.length > 0 ? 
            Math.max(...salesData.map(s => new Date(s.saleDate).getTime())) : null
        }
      },
      sales: salesData.map(sale => ({
        id: sale.id,
        itemName: sale.itemName,
        itemCategory: sale.itemCategory,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalPrice: sale.totalPrice,
        saleDate: sale.saleDate,
        shopId: sale.shopId,
        userId: sale.userId
      })),
      summary: SalesStorage.getSalesStats('', salesData)
    }

    // Créer et télécharger le fichier JSON
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `analyse_ventes_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, filename: `analyse_ventes_${new Date().toISOString().split('T')[0]}.json` }
  }
}
