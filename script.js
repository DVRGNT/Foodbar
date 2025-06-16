document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANTE: Cole aqui a URL do seu App da Web !!!
    const API_URL = 'https://script.google.com/macros/s/AKfycbwzdWPIMjXywQTGud3Mb8rJh3fA2BA8B08mzpiqaFrMyYIrv1MU3L2J2ALGrLloQQ46UQ/exec';

    const productList = document.getElementById('product-list');
    const productCardTemplate = document.getElementById('product-card-template');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutArea = document.getElementById('checkout-area');
    const finalizePurchaseBtn = document.getElementById('finalize-purchase');
    const loadingOverlay = document.getElementById('loading-overlay');

    let allProducts = [];
    let cart = [];

    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    async function fetchProducts() {
        showLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro ao buscar produtos.');
            const data = await response.json();
            
            // A resposta agora só tem 'produtos'
            allProducts = data.produtos;

            renderProducts();
        } catch (error) {
            productList.innerHTML = `<p>Não foi possível carregar os produtos. Tente novamente mais tarde.</p>`;
            console.error(error);
        } finally {
            showLoading(false);
        }
    }

    // A função renderProducts não precisa de alterações
    function renderProducts() {
        productList.innerHTML = '';
        allProducts.forEach(product => {
            if (product.estoque <= 0) return;

            const card = productCardTemplate.content.cloneNode(true);
            
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
                const quantity = parseInt(quantityInput.value);
                // Passamos o objeto product inteiro, que já contém o nome como 'id'
                addToCart(product, quantity);
            });

            productList.appendChild(card);
        });
    }
    
    // As funções addToCart e renderCart não precisam de alterações
    function addToCart(product, quantity) {
        // O 'product.id' agora contém o nome do produto
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantidade += quantity;
        } else {
            cart.push({ ...product, quantidade: quantity });
        }
        
        alert(`${quantity}x ${product.nome} adicionado(s) ao carrinho!`);
        renderCart();
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            checkoutArea.style.display = 'none';
            return;
        }

        let total = 0;
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `<span>${item.quantidade}x ${item.nome}</span> <strong>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</strong>`;
            cartItemsContainer.appendChild(itemElement);
            total += item.preco * item.quantidade;
        });

        cartTotalElement.innerHTML = `<strong>Total: R$ ${total.toFixed(2).replace('.', ',')}</strong>`;
        checkoutArea.style.display = 'block';
    }

    // A função finalizePurchase não precisa de alterações
    async function finalizePurchase() {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        showLoading(true);
        const orderPayload = {
            items: cart.map(item => ({ id: item.id, quantidade: item.quantidade, nome: item.nome }))
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });
            alert('Compra finalizada com sucesso! O estoque foi atualizado.');
            cart = [];
            renderCart();
            fetchProducts();
        } catch (error) {
            console.error('Erro ao finalizar compra:', error);
            alert('Ocorreu um erro ao finalizar a compra.');
        } finally {
            showLoading(false);
        }
    }
    
    finalizePurchaseBtn.addEventListener('click', finalizePurchase);

    fetchProducts();
});