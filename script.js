// CÓDIGO COMPLETO E FINAL DO SCRIPT.JS
document.addEventListener('DOMContentLoaded', initializeApp);

// --- VARIÁVEIS GLOBAIS ---
const API_URL = 'https://script.google.com/macros/s/AKfycbyFRatCpg5PVyL6bhcHcJY7IbWQE0ItXTGh9faYMmARfHfH1amiIt_Q4mBP2d476BFzfQ/exec';
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
const mobileCartBtn = document.getElementById('mobile-cart-btn');
const mobileCartCount = document.getElementById('mobile-cart-count');
const confirmPurchaseOverlay = document.getElementById('confirm-purchase-overlay');
const confirmPurchaseText = document.getElementById('confirm-purchase-text');
const btnConfirmFinal = document.getElementById('btn-confirm-purchase-final');
const btnCancelPurchase = document.getElementById('btn-cancel-purchase');

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
        // Se já existe um usuário salvo, busca os dados dele
        loadUserData(storedName);
    } else {
        // Se não, mostra a tela de login
        loginModalOverlay.classList.remove('hidden');
    }

    loginSubmitBtn.addEventListener('click', () => {
        const name = loginNameInput.value.trim();
        if (name) {
            loginModalOverlay.classList.add('hidden');
            // Carrega os dados do novo usuário (o gasto será 0 se ele não existir na planilha)
            loadUserData(name);
            localStorage.setItem('foodBarUserName', name);
        }
    });
}

async function loadUserData(name) {
    currentUser.name = name;
    updateUserDisplay(); // Mostra o nome imediatamente
    try {
        const response = await fetch(`<span class="math-inline">\{API\_URL\}?user\=</span>{encodeURIComponent(name)}`);
        const data = await response.json();
        currentUser.totalSpent = data.gastoTotal || 0;
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        currentUser.totalSpent = 0; // Assume 0 em caso de erro
    } finally {
        // Atualiza a tela com o valor que veio da planilha
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

// --- LÓGICA DE PRODUTOS E CARRINHO (sem alterações) ---
async function fetchProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data.produtos;
        renderProducts();
    } catch (error) { console.error(error); } finally { showLoading(false); }
}

function renderProducts() {
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
    if (existingItem) { existingItem.quantidade += quantity; } else { cart.push({ ...product, quantidade: quantity }); }
    showToast(`${quantity}x ${product.nome} adicionado!`);
    renderCart();
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    finalizePurchaseBtn.style.display = 'none';
    cartTotalElement.style.display = 'none';
    mobileCartBtn.classList.add('hidden'); // Esconde por padrão

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        return;
    }

    // --- LÓGICA DO BOTÃO FLUTUANTE ---
    const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0);
    mobileCartCount.textContent = totalItems;
    mobileCartBtn.classList.remove('hidden');
    // --------------------------------

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

    // Calcula o total e atualiza o texto do modal
    const totalValue = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    confirmPurchaseText.innerHTML = `Você está prestes a finalizar uma compra no valor de <strong>R$ ${totalValue.toFixed(2).replace('.', ',')}</strong>. Deseja continuar?`;

    // Abre o modal
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
        // ATUALIZA O GASTO TOTAL NA TELA INSTANTANEAMENTE
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

function renderProducts() {
    productList.innerHTML = '';
    allProducts.forEach(product => {
        // Cria o card a partir do template
        const card = productCardTemplate.content.cloneNode(true);

        // --- SEU BLOCO DE IMAGEM (ESTÁ CORRETO) ---
        // Adicionei uma checagem de segurança extra para o caso do elemento não existir.
        if (product.imagem) {
            const productImage = card.querySelector('.product-image');
            if (productImage) {
                productImage.src = product.imagem;
                productImage.alt = product.nome;
            }
        }
        // -----------------------------------------

        // Configura o restante das informações do card
        card.querySelector('.product-name').textContent = product.nome;
        card.querySelector('.product-price').textContent = `R$ ${product.preco.toFixed(2).replace('.', ',')}`;
        card.querySelector('.product-stock').textContent = `Estoque: ${product.estoque}`;
        
        const quantityInput = card.querySelector('.quantity-input');
        quantityInput.max = product.estoque;

        // Adiciona os eventos aos botões do card
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

        // --- A LINHA CRÍTICA QUE ESTAVA FALTANDO ---
        // Este comando pega o card pronto e o insere na página.
        productList.appendChild(card);
    });
}

btnConfirmFinal.addEventListener('click', () => {
    confirmPurchaseOverlay.classList.add('hidden');
    finalizePurchase(); // Chama a função que faz a mágica acontecer
});

btnCancelPurchase.addEventListener('click', () => {
    confirmPurchaseOverlay.classList.add('hidden');
});