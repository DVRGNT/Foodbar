// ===================================================================
// VERSÃO COMPLETA E FINAL DO SCRIPT.JS - PARA GARANTIR ESTABILIDADE
// ===================================================================

document.addEventListener('DOMContentLoaded', initializeApp);

// --- VARIÁVEIS GLOBAIS ---
// !!! VERIFIQUE SE A URL AINDA É A CORRETA !!!
const API_URL = 'https://script.google.com/macros/s/AKfycbyzXJSTccuCm8tIcWIAW97AvfqlWMZk5RIJrXDGd5TPLsSdWNofnn5FY8-8RKPAJS6pTg/exec'; 

let allProducts = [];
let cart = [];
let currentUser = { name: null, totalSpent: 0 };

// --- ELEMENTOS DO DOM ---
let productList, productCardTemplate, cartItemsContainer, cartTotalElement,
    finalizePurchaseBtn, loadingOverlay, userDisplay, loginModalOverlay,
    loginNameInput, loginSubmitBtn, mobileCartBtn, mobileCartCount,
    confirmPurchaseOverlay, confirmPurchaseText, btnConfirmFinal, btnCancelPurchase;

// --- INICIALIZAÇÃO ---
function initializeApp() {
    // Atribui os elementos do DOM aqui para garantir que a página carregou
    productList = document.getElementById('product-list');
    productCardTemplate = document.getElementById('product-card-template');
    cartItemsContainer = document.getElementById('cart-items');
    cartTotalElement = document.getElementById('cart-total');
    finalizePurchaseBtn = document.getElementById('finalize-purchase');
    loadingOverlay = document.getElementById('loading-overlay');
    userDisplay = document.getElementById('user-display');
    loginModalOverlay = document.getElementById('login-modal-overlay');
    loginNameInput = document.getElementById('login-name-input');
    loginSubmitBtn = document.getElementById('login-submit-btn');
    mobileCartBtn = document.getElementById('mobile-cart-btn');
    mobileCartCount = document.getElementById('mobile-cart-count');
    confirmPurchaseOverlay = document.getElementById('confirm-purchase-overlay');
    confirmPurchaseText = document.getElementById('confirm-purchase-text');
    btnConfirmFinal = document.getElementById('btn-confirm-purchase-final');
    btnCancelPurchase = document.getElementById('btn-cancel-purchase');
    
    if (API_URL === 'COLE_A_URL_DA_SUA_API_AQUI') {
        alert('ERRO CRÍTICO: A URL da API não foi definida no arquivo script.js!');
        return;
    }
    
    fetchProducts();
    checkUserSession();

    // Listeners de eventos
    finalizePurchaseBtn.addEventListener('click', handlePurchase);
    btnConfirmFinal.addEventListener('click', () => {
        confirmPurchaseOverlay.classList.add('hidden');
        finalizePurchase();
    });
    btnCancelPurchase.addEventListener('click', () => {
        confirmPurchaseOverlay.classList.add('hidden');
    });
}

// --- LÓGICA DE USUÁRIO ---
function checkUserSession() {
    const storedName = localStorage.getItem('foodBarUserName');
    if (storedName) {
        loadUserData(storedName);
    } else {
        loginModalOverlay.classList.remove('hidden');
    }
    loginSubmitBtn.addEventListener('click', () => {
        const name = loginNameInput.value.trim();
        if (name) {
            localStorage.setItem('foodBarUserName', name);
            loginModalOverlay.classList.add('hidden');
            loadUserData(name);
        }
    });
}

async function loadUserData(name) {
    currentUser.name = name;
    updateUserDisplay();
    try {
        const response = await fetch(`${API_URL}?user=${encodeURIComponent(name)}`);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const data = await response.json();
        currentUser.totalSpent = data.gastoTotal || 0;
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        currentUser.totalSpent = 0;
    } finally {
        updateUserDisplay();
    }
}

function updateUserDisplay() {
    userDisplay.innerHTML = '';
    if (currentUser.name) {
        const welcomeText = document.createElement('span');
        welcomeText.innerHTML = `Bem-vindo, <strong>${currentUser.name}</strong> | Gasto Total: <strong>R$ ${currentUser.totalSpent.toFixed(2).replace('.', ',')}</strong>`;
        const changeUserBtn = document.createElement('button');
        changeUserBtn.textContent = 'Trocar';
        changeUserBtn.id = 'change-user-btn';
        changeUserBtn.addEventListener('click', logout);
        userDisplay.appendChild(welcomeText);
        userDisplay.appendChild(changeUserBtn);
    }
}

function logout() {
    if (confirm('Deseja trocar de usuário? O carrinho atual será esvaziado.')) {
        localStorage.removeItem('foodBarUserName');
        cart = [];
        location.reload();
    }
}

// --- LÓGICA DE PRODUTOS E CARRINHO ---
async function fetchProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const data = await response.json();
        allProducts = data.produtos;
        renderProducts();
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        productList.innerHTML = `<p>Não foi possível carregar os produtos. Verifique a URL da API e a implantação.</p>`;
    } finally {
        showLoading(false);
    }
}

function renderProducts() {
    productList.innerHTML = '';
    allProducts.forEach(product => {
        const card = productCardTemplate.content.cloneNode(true);

        // --- BLOCO DE CÓDIGO PARA CONFIGURAR A IMAGEM ---
        // Pega o elemento da imagem dentro do card
        const productImage = card.querySelector('.product-image');
        
        // Verifica se o produto tem um link de imagem E se o elemento da imagem existe
        if (product.imagem && productImage) {
            productImage.src = product.imagem;
            productImage.alt = product.nome; // Boa prática para acessibilidade
        }
        // --------------------------------------------------

        // Configura o restante das informações do card (seu código aqui já estava correto)
        card.querySelector('.product-name').textContent = product.nome;
        card.querySelector('.product-price').textContent = `R$ ${product.preco.toFixed(2).replace('.', ',')}`;
        card.querySelector('.product-stock').textContent = `Estoque: ${product.estoque}`;
        
        const quantityInput = card.querySelector('.quantity-input');
        quantityInput.max = product.estoque;

        card.querySelector('.plus').addEventListener('click', () => { 
            if (parseInt(quantityInput.value) < product.estoque) {
                quantityInput.value = parseInt(quantityInput.value) + 1;
            } 
        });
        card.querySelector('.minus').addEventListener('click', () => { 
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });
        card.querySelector('.add-to-cart-btn').addEventListener('click', () => { 
            addToCart(product, parseInt(quantityInput.value)); 
        });

        // Adiciona o card pronto à página
        productList.appendChild(card);
    });
}

function addToCart(product, quantity) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) { existingItem.quantidade += quantity; } else { cart.push({ ...product, quantidade: quantity }); }
    showToast(`${quantity}x ${product.nome} adicionado!`);
    renderCart();
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    finalizePurchaseBtn.style.display = 'none';
    cartTotalElement.style.display = 'none';
    mobileCartBtn.classList.add('hidden');
    if (cart.length === 0) { cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>'; return; }
    const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0);
    mobileCartCount.textContent = totalItems;
    mobileCartBtn.classList.remove('hidden');
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
        itemElement.appendChild(removeBtn); itemElement.appendChild(itemName); itemElement.appendChild(itemPrice);
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
    if (cart.length === 0) { showToast("Carrinho vazio!"); return; }
    const totalValue = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    confirmPurchaseText.innerHTML = `Você está prestes a finalizar uma compra no valor de <strong>R$ ${totalValue.toFixed(2).replace('.', ',')}</strong>. Deseja continuar?`;
    confirmPurchaseOverlay.classList.remove('hidden');
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
        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderPayload) });
        showToast('Compra registrada com sucesso!');
        currentUser.totalSpent += totalValue;
        updateUserDisplay();
        cart = [];
        renderCart();
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
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}