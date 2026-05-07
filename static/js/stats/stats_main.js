// Variables globales pour les graphiques
let ventesChart = null;
let topBalaisChart = null;
let repartitionChart = null;
let locationStatusChart = null;
let depensesChart = null;
let cumulativeNetChart = null;
let marginChart = null;

// Helper pour formater les nombres
function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('fr-FR').format(value);
}

function formatPercentage(value, total) {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Déterminer la classe de performance
function getPerformanceClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 50) return 'bon';
    if (percentage >= 20) return 'moyen';
    return 'faible';
}

function getPerformanceText(percentage) {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 50) return 'Bon';
    if (percentage >= 20) return 'Moyen';
    return 'Faible';
}

// Créer les lignes du tableau des vendeurs
function createVendeursRows(tbody, vendeurs) {
    if (!vendeurs || vendeurs.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 7;
        cell.style.textAlign = 'center';
        cell.textContent = 'Aucun vendeur enregistré';
        return;
    }

    const maxCa = Math.max(...vendeurs.map(v => v.ca_ventes + (v.ca_locations || 0) || 0), 1);

    vendeurs.forEach(vendeur => {
        const ca = vendeur.ca_ventes || 0;
        const caLocations = vendeur.ca_locations || 0;
        const caTotal = ca + caLocations;
        const percentage = maxCa > 0 ? Math.round((caTotal / maxCa) * 100) : 0;
        const performanceClass = getPerformanceClass(percentage);
        const performanceText = getPerformanceText(percentage);

        const row = tbody.insertRow();
        
        const cellVendeur = row.insertCell(0);
        const strong = document.createElement('strong');
        strong.textContent = `${escapeHtml(vendeur.name)} ${escapeHtml(vendeur.surname)}`;
        cellVendeur.appendChild(strong);
        
        const cellRole = row.insertCell(1);
        const span = document.createElement('span');
        span.className = `badge ${vendeur.is_patron ? 'badge-admin' : 'badge-vendeur'}`;
        span.textContent = vendeur.is_patron ? 'Admin' : 'Vendeur';
        cellRole.appendChild(span);
        
        const cellVentes = row.insertCell(2);
        cellVentes.textContent = formatNumber(vendeur.nb_ventes || 0);
        
        const cellLocations = row.insertCell(3);
        cellLocations.textContent = formatNumber(vendeur.nb_locations || 0);
        
        const cellCa = row.insertCell(4);
        cellCa.className = 'ca-value';
        cellCa.textContent = formatCurrency(caTotal);
        
        const cellMarge = row.insertCell(5);
        // Calcul de la marge si disponible
        const margePercent = caTotal > 0 && vendeur.depenses ? ((caTotal - vendeur.depenses) / caTotal) * 100 : 0;
        cellMarge.innerHTML = `<span class="${margePercent >= 30 ? 'text-success' : margePercent >= 15 ? 'text-warning' : 'text-danger'}">${margePercent.toFixed(1)}%</span>`;
        
        const cellPerf = row.insertCell(6);
        cellPerf.style.width = '160px';
        
        const container = document.createElement('div');
        container.className = 'performance-bar-container';
        
        const bar = document.createElement('div');
        bar.className = `performance-bar ${performanceClass}`;
        bar.style.width = `${percentage}%`;
        container.appendChild(bar);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'performance-text';
        textSpan.textContent = `${performanceText} (${percentage}%)`;
        
        cellPerf.appendChild(container);
        cellPerf.appendChild(textSpan);
    });
}

// Créer les lignes du tableau des fournisseurs
function createFournisseursRows(tbody, fournisseurs) {
    if (!fournisseurs || fournisseurs.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.style.textAlign = 'center';
        cell.textContent = 'Aucune dépense fournisseur enregistrée';
        return;
    }

    const totalDepenses = fournisseurs.reduce((sum, f) => sum + (f.total_depenses || 0), 0);

    fournisseurs.forEach(fournisseur => {
        const depense = fournisseur.total_depenses || 0;
        const percentage = totalDepenses > 0 ? Math.round((depense / totalDepenses) * 100) : 0;

        const row = tbody.insertRow();
        
        const cellFournisseur = row.insertCell(0);
        const strong = document.createElement('strong');
        strong.textContent = escapeHtml(fournisseur.fournisseur_name);
        cellFournisseur.appendChild(strong);
        
        const cellDepenses = row.insertCell(1);
        cellDepenses.className = 'depense-value';
        cellDepenses.textContent = formatCurrency(depense);
        
        const cellPercentage = row.insertCell(2);
        cellPercentage.style.width = '160px';
        
        const container = document.createElement('div');
        container.className = 'performance-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'performance-bar';
        bar.style.width = `${percentage}%`;
        bar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        container.appendChild(bar);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'performance-text';
        textSpan.textContent = `${percentage}% du total`;
        
        cellPercentage.appendChild(container);
        cellPercentage.appendChild(textSpan);
    });
}

// Créer une carte KPI
function createKpiCard(icon, title, value, sub, color, trend = null) {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.style.borderLeft = `4px solid ${color}`;
    
    if (title.includes('DÉPENSES')) {
        card.classList.add('depense-card');
    } else if (title.includes('NET')) {
        card.classList.add(value.includes('-') ? 'negative-card' : 'positive-card');
    }
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'kpi-title';
    titleDiv.textContent = `${icon} ${title}`;
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'kpi-value';
    valueDiv.textContent = value;
    valueDiv.style.color = color;
    
    const subDiv = document.createElement('div');
    subDiv.className = 'kpi-sub';
    subDiv.textContent = sub;
    
    card.appendChild(titleDiv);
    card.appendChild(valueDiv);
    card.appendChild(subDiv);
    
    if (trend !== null) {
        const trendDiv = document.createElement('div');
        trendDiv.className = 'kpi-trend';
        const trendIcon = trend >= 0 ? '📈' : '📉';
        const trendColor = trend >= 0 ? '#27ae60' : '#e74c3c';
        trendDiv.innerHTML = `<span style="color: ${trendColor}">${trendIcon} ${Math.abs(trend).toFixed(1)}%</span> par rapport à la période précédente`;
        card.appendChild(trendDiv);
    }
    
    return card;
}

// Créer les cartes KPI
function createKpiCards(container, stats) {
    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'kpi-grid';
    
    // Utiliser les données de statistiques
    const statistiques = stats.statistiques || stats;
    const totalCaVentes = statistiques.total_ca_ventes || 0;
    const totalCaLocations = statistiques.total_ca_locations || 0;
    const totalCa = statistiques.total_ca || (totalCaVentes + totalCaLocations);
    const totalDepenses = statistiques.total_depenses || 0;
    const netCa = statistiques.net_ca || (totalCa - totalDepenses);
    const margeBrute = totalCa > 0 ? (netCa / totalCa) * 100 : 0;
    
    const kpis = [
        { icon: '💰', title: 'VENTES', value: formatCurrency(totalCaVentes), sub: 'Chiffre d\'affaires ventes', color: '#27ae60' },
        { icon: '🏠', title: 'LOCATIONS', value: formatCurrency(totalCaLocations), sub: 'Chiffre d\'affaires locations', color: '#3498db' },
        { icon: '📊', title: 'CA TOTAL BRUT', value: formatCurrency(totalCa), sub: 'Ventes + Locations', color: '#9b59b6' },
        { icon: '📉', title: 'DÉPENSES', value: formatCurrency(totalDepenses), sub: 'Achats fournisseurs', color: '#e74c3c' },
        { icon: '📈', title: 'CA NET', value: formatCurrency(netCa), sub: 'CA Total - Dépenses', color: netCa >= 0 ? '#27ae60' : '#e74c3c' },
        { icon: '🎯', title: 'MARGE BRUTE', value: `${margeBrute.toFixed(1)}%`, sub: 'Marge sur CA total', color: margeBrute >= 30 ? '#27ae60' : margeBrute >= 15 ? '#f39c12' : '#e74c3c' },
        { icon: '👥', title: 'CLIENTS UNIQUES', value: formatNumber(statistiques.clients_count || 0), sub: 'Ayant passé commande', color: '#f39c12' },
    ];
    
    kpis.forEach(kpi => {
        const card = createKpiCard(kpi.icon, kpi.title, kpi.value, kpi.sub, kpi.color);
        kpiGrid.appendChild(card);
    });
    
    container.appendChild(kpiGrid);
}

// Créer une section de résumé des locations
function createLocationsSummary(container, stats) {
    const locationsCount = stats.locations_count || stats.statistiques?.locations_count || 0;
    if (locationsCount === 0) {
        return;
    }
    
    const summaryCard = document.createElement('div');
    summaryCard.className = 'kpi-card';
    summaryCard.style.marginTop = '1rem';
    summaryCard.style.marginBottom = '1rem';
    summaryCard.style.gridColumn = 'span 2';
    summaryCard.style.borderLeft = '4px solid #3498db';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'kpi-title';
    titleDiv.textContent = '🏠 Résumé des locations';
    summaryCard.appendChild(titleDiv);
    
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '1rem';
    grid.style.marginTop = '1rem';
    
    const caLocations = stats.total_ca_locations || stats.statistiques?.total_ca_locations || 0;
    const nbLocations = stats.locations_count || stats.statistiques?.locations_count || 0;
    const avgLocationValue = nbLocations > 0 ? caLocations / nbLocations : 0;
    
    const createStatBlock = (label, value, color) => {
        const div = document.createElement('div');
        const labelDiv = document.createElement('div');
        labelDiv.style.fontSize = '0.85rem';
        labelDiv.style.color = '#666';
        labelDiv.textContent = label;
        const valueDiv = document.createElement('div');
        valueDiv.style.fontSize = '1.5rem';
        valueDiv.style.fontWeight = 'bold';
        valueDiv.style.color = color;
        valueDiv.textContent = value;
        div.appendChild(labelDiv);
        div.appendChild(valueDiv);
        return div;
    };
    
    grid.appendChild(createStatBlock('Nombre total', formatNumber(nbLocations), '#3498db'));
    grid.appendChild(createStatBlock('Chiffre d\'affaires', formatCurrency(caLocations), '#3498db'));
    grid.appendChild(createStatBlock('Prix moyen / location', formatCurrency(avgLocationValue), '#3498db'));
    
    summaryCard.appendChild(grid);
    
    const kpiGrid = container.querySelector('.kpi-grid');
    if (kpiGrid) {
        kpiGrid.insertAdjacentElement('afterend', summaryCard);
    } else {
        container.appendChild(summaryCard);
    }
}

// Créer la section des graphiques principaux
function createMainChartsSection(container) {
    const chartsSection = document.createElement('div');
    chartsSection.className = 'charts-section';
    
    const chart1 = document.createElement('div');
    chart1.className = 'chart-card';
    const chart1Title = document.createElement('div');
    chart1Title.className = 'chart-title';
    chart1Title.textContent = '📈 Évolution mensuelle du CA';
    const canvas1 = document.createElement('canvas');
    canvas1.id = 'ventes-chart';
    chart1.appendChild(chart1Title);
    chart1.appendChild(canvas1);
    
    const chart2 = document.createElement('div');
    chart2.className = 'chart-card';
    const chart2Title = document.createElement('div');
    chart2Title.className = 'chart-title';
    chart2Title.textContent = '📊 CA Net Cumulé';
    const canvas2 = document.createElement('canvas');
    canvas2.id = 'cumulative-net-chart';
    chart2.appendChild(chart2Title);
    chart2.appendChild(canvas2);
    
    chartsSection.appendChild(chart1);
    chartsSection.appendChild(chart2);
    container.appendChild(chartsSection);
}

// Créer la section des graphiques supplémentaires
function createExtraChartsSection(container) {
    const chartsSection = document.createElement('div');
    chartsSection.className = 'charts-section';
    
    const chart1 = document.createElement('div');
    chart1.className = 'chart-card';
    const chart1Title = document.createElement('div');
    chart1Title.className = 'chart-title';
    chart1Title.textContent = '🏆 Top 5 des balais les plus vendus';
    const canvas1 = document.createElement('canvas');
    canvas1.id = 'top-balais-chart';
    chart1.appendChild(chart1Title);
    chart1.appendChild(canvas1);
    
    const chart2 = document.createElement('div');
    chart2.className = 'chart-card';
    const chart2Title = document.createElement('div');
    chart2Title.className = 'chart-title';
    chart2Title.textContent = '🎯 Marge brute mensuelle';
    const canvas2 = document.createElement('canvas');
    canvas2.id = 'margin-chart';
    chart2.appendChild(chart2Title);
    chart2.appendChild(canvas2);
    
    chartsSection.appendChild(chart1);
    chartsSection.appendChild(chart2);
    container.appendChild(chartsSection);
}

// Créer la section des graphiques de répartition
function createRepartitionSection(container) {
    const chartsSection = document.createElement('div');
    chartsSection.className = 'charts-section';
    
    const chart1 = document.createElement('div');
    chart1.className = 'chart-card';
    const chart1Title = document.createElement('div');
    chart1Title.className = 'chart-title';
    chart1Title.textContent = '📊 Répartition Ventes / Locations';
    const canvas1 = document.createElement('canvas');
    canvas1.id = 'repartition-chart';
    chart1.appendChild(chart1Title);
    chart1.appendChild(canvas1);
    
    const chart2 = document.createElement('div');
    chart2.className = 'chart-card';
    const chart2Title = document.createElement('div');
    chart2Title.className = 'chart-title';
    chart2Title.textContent = '⏱️ Statut des locations';
    const canvas2 = document.createElement('canvas');
    canvas2.id = 'location-status-chart';
    chart2.appendChild(chart2Title);
    chart2.appendChild(canvas2);
    
    chartsSection.appendChild(chart1);
    chartsSection.appendChild(chart2);
    container.appendChild(chartsSection);
}

// Créer la section des fournisseurs
function createFournisseursSection(container, stats) {
    const depensesParFournisseur = stats.depenses_par_fournisseur || stats.statistiques?.depenses_par_fournisseur || [];
    if (depensesParFournisseur.length === 0) {
        return;
    }
    
    const fournisseursSection = document.createElement('div');
    fournisseursSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '🏭';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Dépenses par fournisseur'));
    fournisseursSection.appendChild(sectionTitle);
    
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['Fournisseur', 'Dépenses totales', 'Répartition'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    createFournisseursRows(tbody, depensesParFournisseur);
    table.appendChild(tbody);
    
    fournisseursSection.appendChild(table);
    container.appendChild(fournisseursSection);
}

// Créer la section des vendeurs
function createVendeursSection(container, stats) {
    const statsParVendeur = stats.stats_par_vendeur || stats.statistiques?.stats_par_vendeur || [];
    if (statsParVendeur.length === 0) {
        return;
    }
    
    const vendeursSection = document.createElement('div');
    vendeursSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '👨‍💼';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Performance par vendeur'));
    vendeursSection.appendChild(sectionTitle);
    
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['Vendeur', 'Rôle', 'Ventes', 'Locations', 'CA Total', 'Marge', 'Performance'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    createVendeursRows(tbody, statsParVendeur);
    table.appendChild(tbody);
    
    vendeursSection.appendChild(table);
    container.appendChild(vendeursSection);
}

// Calculer les données cumulées
function calculateCumulativeData(data) {
    if (!data || data.length === 0) return [];
    
    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    let cumulativeNet = 0;
    
    return sortedData.map(item => {
        const caTotal = (item.ca_ventes || 0) + (item.ca_locations || 0);
        const net = caTotal - (item.depenses || 0);
        cumulativeNet += net;
        return {
            month: item.month,
            net: net,
            cumulativeNet: cumulativeNet
        };
    });
}

// Créer le graphique d'évolution avec ventes, locations et dépenses
function createVentesChart(data, statsGlobal) {
    const canvas = document.getElementById('ventes-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (ventesChart) ventesChart.destroy();

    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    
    const labels = sortedData.map(item => item.month);
    const caVentes = sortedData.map(item => item.ca_ventes || 0);
    const caLocations = sortedData.map(item => item.ca_locations || 0);
    const depenses = sortedData.map(item => item.depenses || 0);
    
    ventesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '💰 CA Ventes',
                    data: caVentes,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.3,
                    fill: false,
                    borderWidth: 2,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '🏠 CA Locations',
                    data: caLocations,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: false,
                    borderWidth: 2,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '📉 Dépenses',
                    data: depenses,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: false,
                    borderWidth: 2,
                    pointBackgroundColor: '#e74c3c',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Montant (€)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

// Créer le graphique du CA Net Cumulé
function createCumulativeNetChart(data) {
    const canvas = document.getElementById('cumulative-net-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (cumulativeNetChart) cumulativeNetChart.destroy();

    const cumulativeData = calculateCumulativeData(data);
    if (cumulativeData.length === 0) return;

    const labels = cumulativeData.map(item => item.month);
    const cumulativeValues = cumulativeData.map(item => item.cumulativeNet);
    const netValues = cumulativeData.map(item => item.net);

    cumulativeNetChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '📈 CA Net Cumulé',
                    data: cumulativeValues,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#9b59b6',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '📊 CA Net Mensuel',
                    data: netValues,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.3,
                    fill: false,
                    borderWidth: 2,
                    borderDash: [10, 5],
                    pointBackgroundColor: '#f39c12',
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Montant (€)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

// Créer le graphique de marge brute mensuelle
function createMarginChart(data) {
    const canvas = document.getElementById('margin-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (marginChart) marginChart.destroy();

    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    
    const labels = sortedData.map(item => item.month);
    const margins = sortedData.map(item => {
        const caTotal = (item.ca_ventes || 0) + (item.ca_locations || 0);
        const net = caTotal - (item.depenses || 0);
        return caTotal > 0 ? (net / caTotal) * 100 : 0;
    });

    marginChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Marge brute (%)',
                data: margins,
                backgroundColor: margins.map(m => m >= 30 ? '#27ae60' : m >= 15 ? '#f39c12' : '#e74c3c'),
                borderRadius: 8,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Marge: ${context.raw.toFixed(1)}%`;
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Marge brute (%)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return `${value}%`;
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    }
                }
            }
        }
    });
}

// Créer le graphique des top balais
function createTopBalaisChart(data) {
    const canvas = document.getElementById('top-balais-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (topBalaisChart) topBalaisChart.destroy();

    const labels = data.map(item => item.broom_name || 'Inconnu');
    const quantities = data.map(item => item.quantity || 0);

    topBalaisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantités vendues',
                data: quantities,
                backgroundColor: '#f39c12',
                borderRadius: 8,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Vendus: ${context.raw} exemplaire(s)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre d\'exemplaires'
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Balai'
                    }
                }
            }
        }
    });
}

// Créer le graphique de répartition ventes/locations
function createRepartitionChart(ventesCount, locationsCount) {
    const canvas = document.getElementById('repartition-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (repartitionChart) repartitionChart.destroy();

    const total = ventesCount + locationsCount;
    
    repartitionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ventes', 'Locations'],
            datasets: [{
                data: [ventesCount, locationsCount],
                backgroundColor: ['#27ae60', '#3498db'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Créer le graphique des statuts de location
function createLocationStatusChart(statusData) {
    const canvas = document.getElementById('location-status-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (locationStatusChart) locationStatusChart.destroy();

    const data = {
        'in Progress': statusData['in Progress'] || 0,
        'Pending': statusData['Pending'] || 0,
        'Finished': statusData['Finished'] || 0
    };
    
    const total = data['in Progress'] + data['Pending'] + data['Finished'];

    locationStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['En cours', 'En attente', 'Terminées'],
            datasets: [{
                data: [data['in Progress'], data['Pending'], data['Finished']],
                backgroundColor: ['#f39c12', '#e74c3c', '#27ae60'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Créer la section des détails des locations
function createLocationsDetailsSection(container, stats) {
    const locationsCount = stats.locations_count || stats.statistiques?.locations_count || 0;
    if (locationsCount === 0) {
        return;
    }
    
    const locationsSection = document.createElement('div');
    locationsSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '🏠';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Détail des locations'));
    locationsSection.appendChild(sectionTitle);
    
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;';
    
    const statusCard = document.createElement('div');
    statusCard.className = 'kpi-card';
    statusCard.style.borderLeft = '4px solid #3498db';
    
    const statusTitle = document.createElement('div');
    statusTitle.className = 'kpi-title';
    statusTitle.textContent = '📍 Statut des locations';
    statusCard.appendChild(statusTitle);
    
    const statusContainer = document.createElement('div');
    statusContainer.style.marginTop = '1rem';
    
    const createStatusRow = (label, value, color) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '0.5rem 0';
        row.style.borderBottom = '1px solid #eee';
        
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        const valueSpan = document.createElement('strong');
        valueSpan.style.color = color;
        valueSpan.textContent = value;
        
        row.appendChild(labelSpan);
        row.appendChild(valueSpan);
        return row;
    };
    
    const locationStatus = stats.location_status || stats.statistiques?.location_status || {};
    statusContainer.appendChild(createStatusRow('🔄 En cours:', locationStatus['in Progress'] || 0, '#f39c12'));
    statusContainer.appendChild(createStatusRow('⏳ En attente:', locationStatus['Pending'] || 0, '#e74c3c'));
    statusContainer.appendChild(createStatusRow('✅ Terminées:', locationStatus['Finished'] || 0, '#27ae60'));
    
    const totalRow = document.createElement('div');
    totalRow.style.display = 'flex';
    totalRow.style.justifyContent = 'space-between';
    totalRow.style.padding = '0.5rem 0';
    totalRow.style.marginTop = '0.5rem';
    totalRow.style.background = '#f8f9fa';
    totalRow.style.borderRadius = '8px';
    totalRow.style.padding = '0.75rem';
    
    const totalLabel = document.createElement('span');
    totalLabel.textContent = '📊 Total:';
    const totalValue = document.createElement('strong');
    totalValue.style.fontSize = '1.1rem';
    totalValue.textContent = locationsCount;
    
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    statusContainer.appendChild(totalRow);
    
    statusCard.appendChild(statusContainer);
    statsGrid.appendChild(statusCard);
    
    const statsParVendeur = stats.stats_par_vendeur || stats.statistiques?.stats_par_vendeur || [];
    if (statsParVendeur.length > 0) {
        const vendeursWithLocations = statsParVendeur.filter(v => v.nb_locations > 0);
        if (vendeursWithLocations.length > 0) {
            const topVendeurCard = document.createElement('div');
            topVendeurCard.className = 'kpi-card';
            topVendeurCard.style.borderLeft = '4px solid #9b59b6';
            
            const topTitle = document.createElement('div');
            topTitle.className = 'kpi-title';
            topTitle.textContent = '👨‍💼 Top vendeurs (locations)';
            topVendeurCard.appendChild(topTitle);
            
            const listContainer = document.createElement('div');
            listContainer.style.marginTop = '1rem';
            
            vendeursWithLocations
                .sort((a, b) => b.nb_locations - a.nb_locations)
                .slice(0, 3)
                .forEach(v => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.padding = '0.5rem 0';
                    row.style.borderBottom = '1px solid #eee';
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = `${escapeHtml(v.name)} ${escapeHtml(v.surname)}:`;
                    const valueSpan = document.createElement('strong');
                    valueSpan.style.color = '#9b59b6';
                    valueSpan.textContent = `${v.nb_locations} location(s)`;
                    
                    row.appendChild(nameSpan);
                    row.appendChild(valueSpan);
                    listContainer.appendChild(row);
                });
            
            topVendeurCard.appendChild(listContainer);
            statsGrid.appendChild(topVendeurCard);
        }
    }
    
    locationsSection.appendChild(statsGrid);
    container.appendChild(locationsSection);
}

// Afficher un message de chargement
function showLoadingMessage(container, message, isError = false, errorDetail = '') {
    if (!container) return;
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = isError ? 'loading error' : 'loading';
    const textNode = document.createTextNode(isError ? `❌ ${message}` : message);
    loadingDiv.appendChild(textNode);
    
    if (isError && errorDetail) {
        const br = document.createElement('br');
        const small = document.createElement('small');
        small.textContent = errorDetail;
        loadingDiv.appendChild(br);
        loadingDiv.appendChild(small);
    }
    
    container.appendChild(loadingDiv);
}

// Créer la section des ventes
function createVentesSection(container, stats) {
    const ventesDetaillees = stats.ventes_detaillees || [];
    if (ventesDetaillees.length === 0) {
        return;
    }
    
    const ventesSection = document.createElement('div');
    ventesSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '💰';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Toutes les ventes'));
    ventesSection.appendChild(sectionTitle);
    
    // Ajouter un résumé des ventes
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;';
    
    const totalVentes = ventesDetaillees.length;
    const totalCaVentes = ventesDetaillees.reduce((sum, v) => sum + (v.total_amount || 0), 0);
    const moyenneVente = totalVentes > 0 ? totalCaVentes / totalVentes : 0;
    
    const summaryItems = [
        { label: 'Nombre total de ventes', value: formatNumber(totalVentes), color: '#27ae60' },
        { label: 'CA total des ventes', value: formatCurrency(totalCaVentes), color: '#27ae60' },
        { label: 'Panier moyen', value: formatCurrency(moyenneVente), color: '#f39c12' }
    ];
    
    summaryItems.forEach(item => {
        const statDiv = document.createElement('div');
        statDiv.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px;';
        statDiv.innerHTML = `
            <div style="font-size: 12px; color: #7f8c8d;">${item.label}</div>
            <div style="font-size: 20px; font-weight: bold; color: ${item.color};">${item.value}</div>
        `;
        summaryDiv.appendChild(statDiv);
    });
    
    ventesSection.appendChild(summaryDiv);
    
    // Créer le tableau des ventes
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['ID Commande', 'Client', 'Date', 'Montant total', 'Balais vendus', 'Vendeur'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    ventesDetaillees.forEach(vente => {
        const row = tbody.insertRow();
        
        row.insertCell(0).textContent = vente.id_commande || '-';
        row.insertCell(1).textContent = `${vente.client_name || ''} ${vente.client_surname || ''}`.trim() || '-';
        row.insertCell(2).textContent = vente.sale_date || '-';
        
        const amountCell = row.insertCell(3);
        amountCell.className = 'ca-value';
        amountCell.textContent = formatCurrency(vente.total_amount || 0);
        
        const itemsCell = row.insertCell(4);
        if (vente.items && vente.items.length > 0) {
            itemsCell.innerHTML = vente.items.map(item => `${item.broom_name || 'Balai'} (${formatCurrency(item.sale_price || 0)})`).join('<br>');
        } else {
            itemsCell.textContent = '-';
        }
        
        row.insertCell(5).textContent = `${vente.employee_name || ''} ${vente.employee_surname || ''}`.trim() || '-';
    });
    
    table.appendChild(tbody);
    ventesSection.appendChild(table);
    container.appendChild(ventesSection);
}

// Créer la section des locations
function createLocationsListSection(container, stats) {
    const locationsDetaillees = stats.locations_detaillees || [];
    if (locationsDetaillees.length === 0) {
        return;
    }
    
    const locationsSection = document.createElement('div');
    locationsSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '🏠';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Toutes les locations'));
    locationsSection.appendChild(sectionTitle);
    
    // Ajouter un résumé des locations
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;';
    
    const totalLocations = locationsDetaillees.length;
    const locationsTerminees = locationsDetaillees.filter(l => l.status === 'Finished').length;
    const locationsEnCours = locationsDetaillees.filter(l => l.status === 'in Progress').length;
    const locationsEnAttente = locationsDetaillees.filter(l => l.status === 'Pending').length;
    const caLocationsTotal = locationsDetaillees.reduce((sum, l) => sum + (l.total_amount || 0), 0);
    
    const summaryItems = [
        { label: 'Total locations', value: formatNumber(totalLocations), color: '#3498db' },
        { label: 'Terminées', value: formatNumber(locationsTerminees), color: '#27ae60' },
        { label: 'En cours', value: formatNumber(locationsEnCours), color: '#f39c12' },
        { label: 'En attente', value: formatNumber(locationsEnAttente), color: '#e74c3c' },
        { label: 'CA total locations', value: formatCurrency(caLocationsTotal), color: '#9b59b6' }
    ];
    
    summaryItems.forEach(item => {
        const statDiv = document.createElement('div');
        statDiv.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px;';
        statDiv.innerHTML = `
            <div style="font-size: 12px; color: #7f8c8d;">${item.label}</div>
            <div style="font-size: 20px; font-weight: bold; color: ${item.color};">${item.value}</div>
        `;
        summaryDiv.appendChild(statDiv);
    });
    
    locationsSection.appendChild(summaryDiv);
    
    // Créer le tableau des locations
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['ID Commande', 'Client', 'Balais', 'Début', 'Fin prévue', 'Fin réelle', 'Durée (jours)', 'Montant', 'Statut'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    const getStatusBadge = (status) => {
        const badges = {
            'Finished': { text: 'Terminée', class: 'badge-success' },
            'in Progress': { text: 'En cours', class: 'badge-warning' },
            'Pending': { text: 'En attente', class: 'badge-danger' }
        };
        const badge = badges[status] || { text: status, class: 'badge-secondary' };
        return `<span class="status-badge ${badge.class}">${badge.text}</span>`;
    };
    
    locationsDetaillees.forEach(location => {
        const row = tbody.insertRow();
        
        row.insertCell(0).textContent = location.id_commande || '-';
        row.insertCell(1).textContent = `${location.client_name || ''} ${location.client_surname || ''}`.trim() || '-';
        
        const broomsCell = row.insertCell(2);
        if (location.brooms && location.brooms.length > 0) {
            broomsCell.innerHTML = location.brooms.map(b => `${b.broom_name || 'Balai'} (${formatCurrency(b.location_price || 0)}/jour)`).join('<br>');
        } else {
            broomsCell.textContent = '-';
        }
        
        row.insertCell(3).textContent = location.begin_date || '-';
        row.insertCell(4).textContent = location.end_date || '-';
        row.insertCell(5).textContent = location.actual_end_date || 'Non retourné';
        
        // Calculer la durée
        let duration = '-';
        if (location.begin_date) {
            const end = location.actual_end_date || location.end_date;
            if (end) {
                const startDate = new Date(location.begin_date);
                const endDate = new Date(end);
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                duration = diffDays;
            }
        }
        row.insertCell(6).textContent = duration;
        
        const amountCell = row.insertCell(7);
        amountCell.className = 'ca-value';
        amountCell.textContent = formatCurrency(location.total_amount || 0);
        
        row.insertCell(8).innerHTML = getStatusBadge(location.status);
    });
    
    table.appendChild(tbody);
    locationsSection.appendChild(table);
    container.appendChild(locationsSection);
}

// Créer la section des commandes fournisseurs
function createCommandesFournisseurSection(container, stats) {
    const commandesFournisseur = stats.commandes_fournisseur || [];
    if (commandesFournisseur.length === 0) {
        return;
    }
    
    const commandesSection = document.createElement('div');
    commandesSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '📦';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Commandes fournisseurs'));
    commandesSection.appendChild(sectionTitle);
    
    // Ajouter un résumé des commandes
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;';
    
    const totalCommandes = commandesFournisseur.length;
    const totalDepensesCommandes = commandesFournisseur.reduce((sum, cmd) => sum + (cmd.total_depense || 0), 0);
    const totalBalaisCommandes = commandesFournisseur.reduce((sum, cmd) => sum + (cmd.total_articles || 0), 0);
    const commandesEnAttente = commandesFournisseur.filter(cmd => cmd.status === 'Pending Approuval' || cmd.status === 'Pending').length;
    
    const summaryItems = [
        { label: 'Total commandes', value: formatNumber(totalCommandes), color: '#9b59b6' },
        { label: 'Dépenses totales', value: formatCurrency(totalDepensesCommandes), color: '#e74c3c' },
        { label: 'Balais commandés', value: formatNumber(totalBalaisCommandes), color: '#3498db' },
        { label: 'En attente', value: formatNumber(commandesEnAttente), color: '#f39c12' },
        { label: 'Dépense moyenne/commande', value: formatCurrency(totalCommandes > 0 ? totalDepensesCommandes / totalCommandes : 0), color: '#e67e22' }
    ];
    
    summaryItems.forEach(item => {
        const statDiv = document.createElement('div');
        statDiv.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px;';
        statDiv.innerHTML = `
            <div style="font-size: 12px; color: #7f8c8d;">${item.label}</div>
            <div style="font-size: 20px; font-weight: bold; color: ${item.color};">${item.value}</div>
        `;
        summaryDiv.appendChild(statDiv);
    });
    
    commandesSection.appendChild(summaryDiv);
    
    // Créer le tableau des commandes
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['ID', 'Date commande', 'Fournisseur', 'Vendeur', 'Statut', 'Articles', 'Montant total'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    const getStatusBadge = (status) => {
        const badges = {
            'Finished': { text: 'Terminée', class: 'badge-success' },
            'In transit': { text: 'En transit', class: 'badge-warning' },
            'Processing': { text: 'En traitement', class: 'badge-info' },
            'Pending': { text: 'En attente', class: 'badge-warning' },
            'Pending Approuval': { text: 'En attente validation', class: 'badge-danger' },
            'Cancelled': { text: 'Annulée', class: 'badge-danger' }
        };
        const badge = badges[status] || { text: status, class: 'badge-secondary' };
        return `<span class="status-badge ${badge.class}">${badge.text}</span>`;
    };
    
    commandesFournisseur.forEach(commande => {
        const row = tbody.insertRow();
        
        row.insertCell(0).textContent = commande.id_commande || '-';
        row.insertCell(1).textContent = commande.command_date || '-';
        
        // Fournisseur (prendre le premier item ou afficher inconnu)
        const fournisseur = commande.items && commande.items[0] ? commande.items[0].fournisseur_name : 'Inconnu';
        row.insertCell(2).textContent = fournisseur;
        
        row.insertCell(3).textContent = `${commande.vendeur_name || ''} ${commande.vendeur_surname || ''}`.trim() || '-';
        row.insertCell(4).innerHTML = getStatusBadge(commande.status);
        
        const articlesCell = row.insertCell(5);
        if (commande.items && commande.items.length > 0) {
            articlesCell.innerHTML = commande.items.map(item => 
                `${item.broom_name || 'Balai'} (x${item.quantity || 0}) - ${formatCurrency(item.total_price || 0)}`
            ).join('<br>');
        } else {
            articlesCell.textContent = '-';
        }
        
        const totalCell = row.insertCell(6);
        totalCell.className = 'depense-value';
        totalCell.textContent = formatCurrency(commande.total_depense || 0);
    });
    
    table.appendChild(tbody);
    commandesSection.appendChild(table);
    container.appendChild(commandesSection);
}

// Créer la section des balais en stock
function createBroonsStockSection(container, stats) {
    const balaisStock = stats.balais_stock || [];
    if (balaisStock.length === 0) {
        return;
    }
    
    const balaisSection = document.createElement('div');
    balaisSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = '🧹';
    sectionTitle.appendChild(titleSpan);
    sectionTitle.appendChild(document.createTextNode(' Balais en stock'));
    balaisSection.appendChild(sectionTitle);
    
    // Ajouter un résumé des balais
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;';
    
    const totalBalais = balaisStock.length;
    const balaisDisponibles = balaisStock.filter(b => b.status === 'in stock').length;
    const balaisEnLocation = balaisStock.filter(b => b.status === 'in location').length;
    const balaisVendus = balaisStock.filter(b => b.status === 'sold').length;
    const balaisEnArrivage = balaisStock.filter(b => b.status === 'arriving').length;
    const valeurStock = balaisStock.reduce((sum, b) => sum + (b.purchase_price || 0), 0);
    const valeurVentePotentielle = balaisStock.reduce((sum, b) => sum + (b.sale_price || 0), 0);
    
    const summaryItems = [
        { label: 'Total balais', value: formatNumber(totalBalais), color: '#2c3e50' },
        { label: 'Disponibles', value: formatNumber(balaisDisponibles), color: '#27ae60' },
        { label: 'En location', value: formatNumber(balaisEnLocation), color: '#f39c12' },
        { label: 'Vendus', value: formatNumber(balaisVendus), color: '#9b59b6' },
        { label: 'En arrivage', value: formatNumber(balaisEnArrivage), color: '#3498db' },
        { label: 'Valeur stock (achat)', value: formatCurrency(valeurStock), color: '#e74c3c' },
        { label: 'Valeur vente potentielle', value: formatCurrency(valeurVentePotentielle), color: '#27ae60' }
    ];
    
    // Créer une grille pour les résumés
    const summaryGrid = document.createElement('div');
    summaryGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;';
    
    summaryItems.forEach(item => {
        const statDiv = document.createElement('div');
        statDiv.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;';
        statDiv.innerHTML = `
            <div style="font-size: 12px; color: #7f8c8d;">${item.label}</div>
            <div style="font-size: 20px; font-weight: bold; color: ${item.color};">${item.value}</div>
        `;
        summaryGrid.appendChild(statDiv);
    });
    
    balaisSection.appendChild(summaryGrid);
    
    // Ajouter des filtres pour les balais
    const filterDiv = document.createElement('div');
    filterDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;';
    filterDiv.innerHTML = `
        <button class="stock-filter-btn active" data-filter="all">Tous</button>
        <button class="stock-filter-btn" data-filter="in stock">Disponibles</button>
        <button class="stock-filter-btn" data-filter="in location">En location</button>
        <button class="stock-filter-btn" data-filter="sold">Vendus</button>
        <button class="stock-filter-btn" data-filter="arriving">En arrivage</button>
    `;
    balaisSection.appendChild(filterDiv);
    
    // Créer le tableau des balais
    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto';
    
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    table.id = 'balais-stock-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['ID', 'Nom', 'Fabricant', 'Prix vente', 'Prix location', "Prix d'achat", 'Utilisations', 'Usure', 'Statut'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    tbody.id = 'balais-stock-tbody';
    table.appendChild(tbody);
    
    tableWrapper.appendChild(table);
    balaisSection.appendChild(tableWrapper);
    container.appendChild(balaisSection);
    
    // Stocker les données pour le filtrage
    window.balaisStockData = balaisStock;
    
    // Fonction de filtrage
    const filterButtons = filterDiv.querySelectorAll('.stock-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            filterBalaisStockTable(filter);
        });
    });
    
    // Afficher tous les balais
    filterBalaisStockTable('all');
}

function filterBalaisStockTable(filter) {
    const tbody = document.getElementById('balais-stock-tbody');
    if (!tbody || !window.balaisStockData) return;
    
    tbody.innerHTML = '';
    
    const filteredData = filter === 'all' 
        ? window.balaisStockData 
        : window.balaisStockData.filter(b => b.status === filter);
    
    const getStatusBadge = (status) => {
        const badges = {
            'in stock': { text: 'Disponible', class: 'badge-success' },
            'in location': { text: 'En location', class: 'badge-warning' },
            'sold': { text: 'Vendu', class: 'badge-secondary' },
            'arriving': { text: 'En arrivage', class: 'badge-info' }
        };
        const badge = badges[status] || { text: status, class: 'badge-secondary' };
        return `<span class="status-badge ${badge.class}">${badge.text}</span>`;
    };
    
    const getWearClass = (wear) => {
        if (wear >= 80) return 'text-danger';
        if (wear >= 50) return 'text-warning';
        if (wear >= 20) return 'text-info';
        return 'text-success';
    };
    
    filteredData.forEach(balai => {
        const row = tbody.insertRow();
        
        row.insertCell(0).textContent = balai.id_balai || '-';
        row.insertCell(1).textContent = balai.Libelle || '-';
        row.insertCell(2).textContent = balai.fabricant_name || '-';
        row.insertCell(3).className = 'ca-value';
        row.insertCell(3).textContent = formatCurrency(balai.sale_price || 0);
        row.insertCell(4).className = 'ca-value';
        row.insertCell(4).textContent = formatCurrency(balai.location_price || 0);
        row.insertCell(5).className = 'depense-value';
        row.insertCell(5).textContent = formatCurrency(balai.purchase_price || 0);
        row.insertCell(6).textContent = balai.uses_number || 0;
        
        const wear = balai.wear || 0;
        const wearCell = row.insertCell(7);
        wearCell.innerHTML = `<span class="${getWearClass(wear)}">${wear}%</span>`;
        
        row.insertCell(8).innerHTML = getStatusBadge(balai.status);
    });
}

function renderStats(stats) {
    const container = document.getElementById('stats-content');
    if (!container) return;
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    createKpiCards(container, stats);
    createLocationsSummary(container, stats);
    createMainChartsSection(container);
    createLocationsDetailsSection(container, stats);
    
    // Nouvelles sections
    createVentesSection(container, stats);
    createLocationsListSection(container, stats);
    createCommandesFournisseurSection(container, stats);
    createBroonsStockSection(container, stats);
    
    createVendeursSection(container, stats);
    createFournisseursSection(container, stats);
    createRepartitionSection(container);
    createExtraChartsSection(container);

    setTimeout(() => {
        const monthlyData = stats.data_par_mois || stats.statistiques?.data_par_mois || [];
        createVentesChart(monthlyData, stats);
        createCumulativeNetChart(monthlyData);
        createMarginChart(monthlyData);
        createTopBalaisChart(stats.top_balais || stats.statistiques?.top_balais || []);
        
        const ventesCount = stats.ventes_count || stats.statistiques?.ventes_count || 0;
        const locationsCount = stats.locations_count || stats.statistiques?.locations_count || 0;
        createRepartitionChart(ventesCount, locationsCount);
        
        const locationStatus = stats.location_status || stats.statistiques?.location_status || {};
        createLocationStatusChart(locationStatus);
    }, 100);
}

// Charger les statistiques depuis l'API
async function loadStats() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    const periodSelect = document.getElementById('period-select');
    const period = periodSelect ? periodSelect.value : 'all';

    let url = '/api/admin/stats';
    const params = new URLSearchParams();
    
    if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
    } else if (period !== 'all') {
        params.append('period', period);
    }

    if (params.toString()) {
        url += '?' + params.toString();
    }

    const contentDiv = document.getElementById('stats-content');
    if (!contentDiv) return;
    
    showLoadingMessage(contentDiv, 'Chargement des statistiques...');

    try {
        // Charger les stats principales
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.stats) {
            renderStats(data.stats);
        } else {
            showLoadingMessage(contentDiv, 'Erreur lors du chargement des statistiques', true, 'Données invalides');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showLoadingMessage(contentDiv, 'Erreur lors du chargement des statistiques', true, error.message);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadStats);
    }
    
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const periodSelect = document.getElementById('period-select');

    if (startDate && endDate) {
        startDate.addEventListener('change', () => {
            if (startDate.value && endDate.value && periodSelect) {
                periodSelect.value = 'all';
                loadStats();
            }
        });

        endDate.addEventListener('change', () => {
            if (startDate.value && endDate.value && periodSelect) {
                periodSelect.value = 'all';
                loadStats();
            }
        });
    }

    if (periodSelect) {
        periodSelect.addEventListener('change', () => {
            if (periodSelect.value !== 'all') {
                if (startDate) startDate.value = '';
                if (endDate) endDate.value = '';
            }
            loadStats();
        });
    }
});