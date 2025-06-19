// CÓDIGO COMPLETO DO SCRIPT.JS - VERSÃO COM USUÁRIOS
document.addEventListener('DOMContentLoaded', initializeApp);

// --- VARIÁVEIS GLOBAIS ---
const API_URL = 'https://script.google.com/macros/s/AKfycbyCi429C2jAQfHQPfEIResniNe8xt5zwVS8Eflr4sdt3R2r8ZPdF7K4huWTvLYKZuMdTw/exec'; // !!! IMPORTANTE !!!
let allProducts = [];
let cart = [];
let currentUser = { name: null, totalSpent: 0 };

// --- ELEMENTOS DO DOM ---
const productList = document.getElementById('product-list');
const productCardTemplate = document.getElementById('product-card-template');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const finalizePurchaseBtn = document.getElementById('finalize-purchase');
const loadingOverlay = document.getElementById('loading-overlay');
const userDisplay = document.getElementById('user-display');
const loginModalOverlay = document.getElementById('login-modal-overlay');
const loginNameInput = document.getElementById('login-name-input');
const loginSubmitBtn = document.getElementById('login-submit-btn');

// --- INICIALIZAÇÃO ---
function initializeApp() {
    fetchProducts();
    checkUserSession();
    finalizePurchaseBtn.addEventListener('click', handlePurchase);
}

// --- LÓGICA DE USUÁRIO ---
function checkUserSession() {
    const storedName = localStorage.getItem('foodBarUserName');
    if (storedName) {
        currentUser.name = storedName;
        updateUserDisplay();
    } else {
        loginModalOverlay.classList.remove('hidden');
    }

    loginSubmitBtn.addEventListener('click', () => {
        const name = loginNameInput.value.trim();
        if (name) {
            currentUser.name = name;
            localStorage.setItem('foodBarUserName', name);
            loginModalOverlay.classList.add('hidden');
            updateUserDisplay();
        }
    });
}

function updateUserDisplay() {
    if (currentUser.name) {
        userDisplay.innerHTML = `Bem-vindo, <strong>${currentUser.name}</strong>`;
    } else {
        userDisplay.innerHTML = '';
    }
}

// --- LÓGICA DE PRODUTOS E CARRINHO ---
async function fetchProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data.produtos;
        renderProducts();
    } catch (error) {
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function renderProducts() {
    // (Esta função não muda, pode usar a sua versão anterior)
    productList.innerHTML = '';
    allProducts.forEach(product => {
        const card = productCardTemplate.content.cloneNode(true);
        card.querySelector('.product-name').textContent = product.nome;
        card.querySelector('.product-price').textContent = `R$ ${product.preco.toFixed(2).replace('.', ',')}`;
        card.querySelector('.product-stock').textContent = `Estoque: ${product.estoque}`;
        const quantityInput = card.querySelector('.quantity-input');
        quantityInput.max = product.estoque;
        card.querySelector('.plus').addEventListener('click', () => { if (parseInt(quantityInput.value) < product.estoque) quantityInput.value = parseInt(quantityInput.value) + 1; });
        card.querySelector('.minus').addEventListener('click', () => { if (parseInt(quantityInput.value) > 1) quantityInput.value = parseInt(quantityInput.value) - 1; });
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => { addToCart(product, parseInt(quantityInput.value)); });
        productList.appendChild(card);
    });
}

function addToCart(product, quantity) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantidade += quantity;
    } else {
        cart.push({ ...product, quantidade: quantity });
    }
    showToast(`${quantity}x ${product.nome} adicionado!`);
    renderCart();
}

function renderCart() {
    // (Esta função não muda, pode usar a sua versão anterior)
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        finalizePurchaseBtn.style.display = 'none';
        cartTotalElement.style.display = 'none';
        return;
    }
    let total = 0;
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-from-cart-btn';
        removeBtn.textContent = '×';
        removeBtn.title = `Remover ${item.nome}`;
        removeBtn.addEventListener('click', () => removeFromCart(item.id));
        const itemName = document.createElement('span');
        itemName.textContent = `${item.quantidade}x ${item.nome}`;
        const itemPrice = document.createElement('strong');
        itemPrice.textContent = `R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}`;
        itemElement.appendChild(removeBtn);
        itemElement.appendChild(itemName);
        itemElement.appendChild(itemPrice);
        cartItemsContainer.appendChild(itemElement);
        total += item.preco * item.quantidade;
    });
    finalizePurchaseBtn.style.display = 'block';
    cartTotalElement.style.display = 'block';
    cartTotalElement.innerHTML = `<strong>Total: R$ ${total.toFixed(2).replace('.', ',')}</strong>`;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    showToast("Item removido do carrinho.");
}

// --- LÓGICA DE COMPRA ---
function handlePurchase() {
    if (cart.length === 0) {
        showToast("Carrinho vazio!");
        return;
    }
    if (confirm("Confirmar a compra deste carrinho?")) {
        finalizePurchase();
    }
}

async function finalizePurchase() {
    showLoading(true);
    const totalValue = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const orderPayload = {
        customerName: currentUser.name,
        totalValue: totalValue,
        items: cart.map(item => ({ id: item.id, quantidade: item.quantidade, nome: item.nome }))
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(orderPayload)
        });
        showToast('Compra registrada com sucesso!');
        cart = [];
        renderCart();
        fetchProducts();
    } catch (error) {
        showToast('Ocorreu um erro ao registrar a compra.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// --- FUNÇÕES UTILITÁRIAS ---
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}