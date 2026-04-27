import { clearElement, createElement } from './profile_api.js';

// Pagination
export function setupPagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || !pagination || pagination.total_pages <= 1) return;
    
    clearElement(container);
    
    for (let i = 1; i <= pagination.total_pages; i++) {
        const btn = createElement('button', i === pagination.current_page ? 'page-btn active' : 'page-btn', i.toString());
        btn.addEventListener('click', () => loadFunction(i));
        container.appendChild(btn);
    }
}