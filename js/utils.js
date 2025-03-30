// Formatting utilities
export const formatters = {
    currency(value) {
        if (value >= 1e9) {
            return `$${(value / 1e9).toFixed(2)}B`;
        } else if (value >= 1e6) {
            return `$${(value / 1e6).toFixed(2)}M`;
        } else if (value >= 1e3) {
            return `$${(value / 1e3).toFixed(2)}K`;
        } else if (value >= 1) {
            return `$${value.toFixed(2)}`;
        } else {
            return `$${value.toFixed(6)}`;
        }
    },

    percentage(value) {
        return value ? `${value.toFixed(2)}%` : '0.00%';
    },

    number(value) {
        return new Intl.NumberFormat().format(Math.round(value));
    }
};

// UI helper functions
export const ui = {
    getChangeClass(change) {
        return change > 0 ? 'up' : change < 0 ? 'down' : '';
    },

    setLoadingState(isLoading) {
        document.querySelectorAll('[data-loading-disable]').forEach(element => {
            element.disabled = isLoading;
        });
        document.querySelectorAll('[data-loading-indicator]').forEach(element => {
            element.style.display = isLoading ? 'block' : 'none';
        });
    },

    sanitizeInput(input) {
        return input.replace(/[<>]/g, '');
    }
};

// DOM manipulation helpers
export const dom = {
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        return element;
    }
}; 