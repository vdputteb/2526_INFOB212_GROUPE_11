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

    const maxCa = Math.max(...vendeurs.map(v => v.ca_ventes || 0), 1);

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
        const margePercent = vendeur.marge_percent || 0;
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
    
    const totalCaVentes = stats.total_ca_ventes || 0;
    const totalCaLocations = stats.total_ca_locations || 0;
    const totalCa = totalCaVentes + totalCaLocations;
    const totalDepenses = stats.total_depenses || 0;
    const netCa = totalCa - totalDepenses;
    const margeBrute = totalCa > 0 ? (netCa / totalCa) * 100 : 0;
    
    const kpis = [
        { icon: '💰', title: 'VENTES', value: formatCurrency(totalCaVentes), sub: 'Chiffre d\'affaires ventes', color: '#27ae60' },
        { icon: '🏠', title: 'LOCATIONS', value: formatCurrency(totalCaLocations), sub: 'Chiffre d\'affaires locations', color: '#3498db' },
        { icon: '📊', title: 'CA TOTAL BRUT', value: formatCurrency(totalCa), sub: 'Ventes + Locations', color: '#9b59b6' },
        { icon: '📉', title: 'DÉPENSES', value: formatCurrency(totalDepenses), sub: 'Achats fournisseurs', color: '#e74c3c' },
        { icon: '📈', title: 'CA NET', value: formatCurrency(netCa), sub: 'CA Total - Dépenses', color: netCa >= 0 ? '#27ae60' : '#e74c3c' },
        { icon: '🎯', title: 'MARGE BRUTE', value: `${margeBrute.toFixed(1)}%`, sub: 'Marge sur CA total', color: margeBrute >= 30 ? '#27ae60' : margeBrute >= 15 ? '#f39c12' : '#e74c3c' },
        { icon: '👥', title: 'CLIENTS UNIQUES', value: formatNumber(stats.clients_count || 0), sub: 'Ayant passé commande', color: '#f39c12' },
    ];
    
    kpis.forEach(kpi => {
        const card = createKpiCard(kpi.icon, kpi.title, kpi.value, kpi.sub, kpi.color);
        kpiGrid.appendChild(card);
    });
    
    container.appendChild(kpiGrid);
}

// Créer une section de résumé des locations
function createLocationsSummary(container, stats) {
    if (!stats.locations_count || stats.locations_count === 0) {
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
    
    const caLocations = stats.total_ca_locations || 0;
    const nbLocations = stats.locations_count || 0;
    const avgLocationValue = nbLocations > 0 ? caLocations / nbLocations : 0;
    const dureeMoyenne = stats.duree_location_moyenne || 0;
    
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
    
    if (dureeMoyenne > 0) {
        grid.appendChild(createStatBlock('Durée moyenne', `${dureeMoyenne.toFixed(1)} jours`, '#3498db'));
    }
    
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
    if (!stats.depenses_par_fournisseur || stats.depenses_par_fournisseur.length === 0) {
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
    createFournisseursRows(tbody, stats.depenses_par_fournisseur);
    table.appendChild(tbody);
    
    fournisseursSection.appendChild(table);
    container.appendChild(fournisseursSection);
}

// Créer la section des vendeurs
function createVendeursSection(container, stats) {
    if (!stats.stats_par_vendeur || stats.stats_par_vendeur.length === 0) {
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
    createVendeursRows(tbody, stats.stats_par_vendeur);
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

// Créer le graphique de répartition
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
    if (!stats.locations_count || stats.locations_count === 0) {
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
    
    statusContainer.appendChild(createStatusRow('🔄 En cours:', stats.location_status?.['in Progress'] || 0, '#f39c12'));
    statusContainer.appendChild(createStatusRow('⏳ En attente:', stats.location_status?.Pending || 0, '#e74c3c'));
    statusContainer.appendChild(createStatusRow('✅ Terminées:', stats.location_status?.Finished || 0, '#27ae60'));
    
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
    totalValue.textContent = stats.locations_count || 0;
    
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    statusContainer.appendChild(totalRow);
    
    statusCard.appendChild(statusContainer);
    statsGrid.appendChild(statusCard);
    
    if (stats.stats_par_vendeur && stats.stats_par_vendeur.length > 0) {
        const vendeursWithLocations = stats.stats_par_vendeur.filter(v => v.nb_locations > 0);
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

// Fonction principale de rendu
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
    createVendeursSection(container, stats);
    createFournisseursSection(container, stats);
    createRepartitionSection(container);
    createExtraChartsSection(container);

    setTimeout(() => {
        const monthlyData = stats.data_par_mois || [];
        createVentesChart(monthlyData, stats);
        createCumulativeNetChart(monthlyData);
        createMarginChart(monthlyData);
        createTopBalaisChart(stats.top_balais || []);
        createRepartitionChart(stats.ventes_count || 0, stats.locations_count || 0);
        createLocationStatusChart(stats.location_status || {});
    }, 100);
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
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Erreur lors du chargement des statistiques');
        }
        const data = await response.json();
        renderStats(data.stats || data);
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