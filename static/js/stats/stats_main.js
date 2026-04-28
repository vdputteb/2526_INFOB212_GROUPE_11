// Variables globales pour les graphiques
let ventesChart = null;
let topBalaisChart = null;
let repartitionChart = null;
let locationStatusChart = null;

// Helper pour formater les nombres
function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('fr-FR').format(value);
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
        cell.colSpan = 6;
        cell.style.textAlign = 'center';
        cell.textContent = 'Aucun vendeur enregistré';
        return;
    }

    const maxCa = Math.max(...vendeurs.map(v => v.ca_ventes || 0), 1);

    vendeurs.forEach(vendeur => {
        const ca = vendeur.ca_ventes || 0;
        const percentage = Math.round((ca / maxCa) * 100);
        const performanceClass = getPerformanceClass(percentage);
        const performanceText = getPerformanceText(percentage);

        const row = tbody.insertRow();
        
        // Vendeur
        const cellVendeur = row.insertCell(0);
        cellVendeur.innerHTML = `<strong>${escapeHtml(vendeur.name)} ${escapeHtml(vendeur.surname)}</strong>`;
        
        // Rôle
        const cellRole = row.insertCell(1);
        cellRole.innerHTML = `<span class="badge ${vendeur.is_patron ? 'badge-admin' : 'badge-vendeur'}">${vendeur.is_patron ? 'Admin' : 'Vendeur'}</span>`;
        
        // Ventes
        const cellVentes = row.insertCell(2);
        cellVentes.textContent = formatNumber(vendeur.nb_ventes || 0);
        
        // Locations
        const cellLocations = row.insertCell(3);
        cellLocations.textContent = formatNumber(vendeur.nb_locations || 0);
        
        // CA
        const cellCa = row.insertCell(4);
        cellCa.className = 'ca-value';
        cellCa.textContent = formatCurrency(ca);
        
        // Performance
        const cellPerf = row.insertCell(5);
        cellPerf.style.width = '160px';
        cellPerf.innerHTML = `
            <div class="performance-bar-container">
                <div class="performance-bar ${performanceClass}" style="width: ${percentage}%;"></div>
            </div>
            <span class="performance-text">${performanceText} (${percentage}%)</span>
        `;
    });
}

// Créer les cartes KPI
function createKpiCards(container, stats) {
    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'kpi-grid';
    
    const kpis = [
        { title: '💰 CHIFFRE D\'AFFAIRES TOTAL', value: formatCurrency(stats.total_ca || 0), sub: 'Toutes ventes confondues' },
        { title: '📦 VENTES', value: formatNumber(stats.ventes_count || 0), sub: 'Commandes d\'achat' },
        { title: '🏠 LOCATIONS', value: formatNumber(stats.locations_count || 0), sub: 'Réservations' },
        { title: '👥 CLIENTS UNIQUES', value: formatNumber(stats.clients_count || 0), sub: 'Ayant passé commande' }
    ];
    
    kpis.forEach(kpi => {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        
        const title = document.createElement('div');
        title.className = 'kpi-title';
        title.textContent = kpi.title;
        
        const value = document.createElement('div');
        value.className = 'kpi-value';
        value.textContent = kpi.value;
        
        const sub = document.createElement('div');
        sub.className = 'kpi-sub';
        sub.textContent = kpi.sub;
        
        card.appendChild(title);
        card.appendChild(value);
        card.appendChild(sub);
        kpiGrid.appendChild(card);
    });
    
    container.appendChild(kpiGrid);
}

// Créer la section des graphiques principaux
function createMainChartsSection(container) {
    const chartsSection = document.createElement('div');
    chartsSection.className = 'charts-section';
    
    const chart1 = document.createElement('div');
    chart1.className = 'chart-card';
    const chart1Title = document.createElement('div');
    chart1Title.className = 'chart-title';
    chart1Title.textContent = '📈 Évolution des ventes (12 derniers mois)';
    const canvas1 = document.createElement('canvas');
    canvas1.id = 'ventes-chart';
    chart1.appendChild(chart1Title);
    chart1.appendChild(canvas1);
    
    const chart2 = document.createElement('div');
    chart2.className = 'chart-card';
    const chart2Title = document.createElement('div');
    chart2Title.className = 'chart-title';
    chart2Title.textContent = '🏆 Top 5 des balais les plus vendus';
    const canvas2 = document.createElement('canvas');
    canvas2.id = 'top-balais-chart';
    chart2.appendChild(chart2Title);
    chart2.appendChild(canvas2);
    
    chartsSection.appendChild(chart1);
    chartsSection.appendChild(chart2);
    container.appendChild(chartsSection);
}

// Créer la section des vendeurs
function createVendeursSection(container, stats) {
    const vendeursSection = document.createElement('div');
    vendeursSection.className = 'vendeurs-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.innerHTML = '<span>👨‍💼</span> Performance par vendeur';
    vendeursSection.appendChild(sectionTitle);
    
    const table = document.createElement('table');
    table.className = 'vendeurs-table';
    
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    const headers = ['Vendeur', 'Rôle', 'Ventes', 'Locations', 'Chiffre d\'affaires', 'Performance'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    createVendeursRows(tbody, stats.stats_par_vendeur || []);
    table.appendChild(tbody);
    
    vendeursSection.appendChild(table);
    container.appendChild(vendeursSection);
}

// Créer la section des graphiques supplémentaires
function createExtraChartsSection(container) {
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

// Créer le graphique d'évolution des ventes
function createVentesChart(data) {
    const ctx = document.getElementById('ventes-chart')?.getContext('2d');
    if (!ctx) return;

    if (ventesChart) ventesChart.destroy();

    const labels = data.map(item => item.month);
    const ventesCounts = data.map(item => item.ventes_count || 0);
    const cas = data.map(item => item.ca || 0);

    ventesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Nombre de ventes',
                    data: ventesCounts,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    yAxisID: 'y',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Chiffre d\'affaires (€)',
                    data: cas,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.3,
                    fill: true
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
                            let label = context.dataset.label || '';
                            let value = context.raw;
                            if (context.dataset.label.includes('€')) {
                                value = formatCurrency(value);
                            }
                            return `${label}: ${value}`;
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
                        text: 'Nombre de ventes'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Chiffre d\'affaires (€)'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Créer le graphique des top balais
function createTopBalaisChart(data) {
    const ctx = document.getElementById('top-balais-chart')?.getContext('2d');
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
                borderRadius: 8
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
                            return `Vendus: ${context.raw} exemplaires`;
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
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Créer le graphique de répartition
function createRepartitionChart(ventesCount, locationsCount) {
    const ctx = document.getElementById('repartition-chart')?.getContext('2d');
    if (!ctx) return;

    if (repartitionChart) repartitionChart.destroy();

    repartitionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ventes', 'Locations'],
            datasets: [{
                data: [ventesCount, locationsCount],
                backgroundColor: ['#27ae60', '#3498db'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = ventesCount + locationsCount;
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
    const ctx = document.getElementById('location-status-chart')?.getContext('2d');
    if (!ctx) return;

    if (locationStatusChart) locationStatusChart.destroy();

    const data = {
        'in Progress': statusData['in Progress'] || 0,
        'Pending': statusData['Pending'] || 0,
        'Finished': statusData['Finished'] || 0
    };

    locationStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['En cours', 'En attente', 'Terminées'],
            datasets: [{
                data: [data['in Progress'], data['Pending'], data['Finished']],
                backgroundColor: ['#f39c12', '#e74c3c', '#27ae60'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = data['in Progress'] + data['Pending'] + data['Finished'];
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Rendre toutes les statistiques
function renderStats(stats) {
    const container = document.getElementById('stats-content');
    
    // Vider le conteneur
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Créer tous les éléments
    createKpiCards(container, stats);
    createMainChartsSection(container);
    createVendeursSection(container, stats);
    createExtraChartsSection(container);

    // Créer les graphiques après avoir injecté les canvases
    createVentesChart(stats.ventes_par_mois || []);
    createTopBalaisChart(stats.top_balais || []);
    createRepartitionChart(stats.ventes_count || 0, stats.locations_count || 0);
    createLocationStatusChart(stats.location_status || {});
}

// Afficher un message de chargement
function showLoadingMessage(container, message, isError = false) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = isError ? 'loading error' : 'loading';
    loadingDiv.innerHTML = isError ? `❌ ${message}<br><small>${arguments[2] || ''}</small>` : message;
    container.appendChild(loadingDiv);
}

// Charger les statistiques depuis l'API
async function loadStats() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const period = document.getElementById('period-select').value;

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
    showLoadingMessage(contentDiv, 'Chargement des statistiques...');

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des statistiques');
        }
        const data = await response.json();
        renderStats(data.stats || data);
    } catch (error) {
        console.error('Erreur:', error);
        showLoadingMessage(contentDiv, 'Erreur lors du chargement des statistiques', error.message);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    // Écouteurs d'événements
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadStats);
    }
    
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const periodSelect = document.getElementById('period-select');

    if (startDate && endDate) {
        startDate.addEventListener('change', () => {
            if (startDate.value && endDate.value) {
                periodSelect.value = 'all';
                loadStats();
            }
        });

        endDate.addEventListener('change', () => {
            if (startDate.value && endDate.value) {
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