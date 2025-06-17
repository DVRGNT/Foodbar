document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANTE: Cole aqui a URL do seu App da Web !!!
    const API_URL = 'https://script.google.com/macros/s/AKfycbwkVhG4oEuHA5xyy54UfoGC3AvT2w8HLq2usfsfYvmWyG5KLu4LZrv_KPqs3-wDFy3WHQ/exec';

    const productList = document.getElementById('product-list');
    const productCardTemplate = document.getElementById('product-card-template');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutArea = document.getElementById('checkout-area');
    const finalizePurchaseBtn = document.getElementById('finalize-purchase');
    const loadingOverlay = document.getElementById('loading-overlay');

    const modalOverlay = document.getElementById('checkout-modal-overlay');
    const modalTotalValue = document.getElementById('modal-total-value');
    const customerNameInput = document.getElementById('customer-name');
    const pixCodeTextarea = document.getElementById('pix-code');
    const copyPixBtn = document.getElementById('copy-pix-btn');
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    const cancelOrderBtn = document.getElementById('cancel-order-btn');

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
        
        showToast(`${quantity}x ${product.nome} adicionado(s) ao carrinho!`);
        renderCart();
    }

    // Substitua sua função renderCart antiga por esta
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            checkoutArea.style.display = 'none';
            cartTotalElement.style.display = 'none'; // Esconde o total se o carrinho estiver vazio
            return;
        }

        let total = 0;
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';

            // --- CRIAÇÃO DO BOTÃO REMOVER ---
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-from-cart-btn';
            removeBtn.textContent = '×'; // Usando um 'x' de multiplicação que é mais elegante
            removeBtn.title = `Remover ${item.nome}`; // Dica ao passar o mouse
            removeBtn.addEventListener('click', () => {
                removeFromCart(item.id);
            });
            // ------------------------------------

            const itemName = document.createElement('span');
            itemName.textContent = `${item.quantidade}x ${item.nome}`;

            const itemPrice = document.createElement('strong');
            itemPrice.textContent = `R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}`;

            // Adiciona os elementos na ordem: Botão, Nome, Preço
            itemElement.appendChild(removeBtn);
            itemElement.appendChild(itemName);
            itemElement.appendChild(itemPrice);

            cartItemsContainer.appendChild(itemElement);
            total += item.preco * item.quantidade;
        });

        cartTotalElement.style.display = 'block'; // Mostra o total
        cartTotalElement.innerHTML = `<strong>Total: R$ ${total.toFixed(2).replace('.', ',')}</strong>`;
        checkoutArea.style.display = 'block';
    }

    /**
     * Mostra uma notificação "toast" no canto da tela.
     * @param {string} message A mensagem a ser exibida.
     */
    function showToast(message) {
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        container.appendChild(toast);

        // Remove o elemento da árvore DOM depois que a animação terminar (3 segundos)
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Remove um produto do carrinho baseado no seu ID (que é o nome do produto).
     * @param {string} productId O ID do produto a ser removido.
     */
    function removeFromCart(productId) {
        // Filtra o carrinho, criando um novo array que exclui o item com o ID correspondente.
        cart = cart.filter(item => item.id !== productId);

        // Re-renderiza o carrinho para mostrar a remoção e atualizar o total.
        renderCart();

        // Mostra uma notificação sutil.
        showToast("Item removido do carrinho.");
    }

    // A função finalizePurchase não precisa de alterações
    async function finalizePurchase(customerName, totalValue) {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        showLoading(true);

        // Prepara os dados para enviar ao backend, incluindo nome e valor
        const orderPayload = {
            customerName: customerName,
            totalValue: totalValue,
            items: cart.map(item => ({ id: item.id, quantidade: item.quantidade, nome: item.nome }))
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });

            showToast('Compra confirmada com sucesso!');
            cart = [];
            renderCart();
            fetchProducts();

        } catch (error) {
            console.error('Erro ao finalizar compra:', error);
            showToast('Ocorreu um erro ao finalizar a compra.');
        } finally {
            showLoading(false);
        }
    }
    
    finalizePurchaseBtn.addEventListener('click', openCheckoutModal);

    function openCheckoutModal() {
        if (cart.length === 0) {
            showToast("Seu carrinho está vazio!");
            return;
        }

        // Calcula o total
        const total = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

        // Formata e exibe o total na modal
        modalTotalValue.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Gera e exibe o "PIX Copia e Cola"
        // Nota: Este é um código de referência, não um BR Code válido de um banco.
        const pixPayload = `
00020126580014BR.GOV.BCB.PIX01362834579e-a476-440b-9e3c-37f3cb697aa85204000053039865802BR5925DIVERGENTE PRODUCAO E SER6009SAO PAULO61080540900062250521aOeIKyLBjX6Kakj1jf3p663042261`;
        pixCodeTextarea.value = pixPayload;

        // Limpa o campo de nome e o estado do botão de copiar
        customerNameInput.value = '';
        copyPixBtn.textContent = 'Copiar';

        // Mostra a modal
        modalOverlay.classList.remove('hidden');
    }

    function closeCheckoutModal() {
        modalOverlay.classList.add('hidden');
    }

    function copyPixToClipboard() {
        pixCodeTextarea.select();
        document.execCommand('copy');
        copyPixBtn.textContent = 'Copiado!';
        showToast('Código PIX copiado!');
    }

    // Adiciona os listeners aos botões da modal
    confirmOrderBtn.addEventListener('click', () => {
        const customerName = customerNameInput.value.trim();
        if (customerName === '') {
            showToast('Por favor, digite seu nome.');
            return;
        }

        const totalValue = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

        // Chama a função para finalizar a compra, passando os dados
        finalizePurchase(customerName, totalValue);

        closeCheckoutModal();
    });

    cancelOrderBtn.addEventListener('click', closeCheckoutModal);
    modalOverlay.addEventListener('click', (event) => {
        // Fecha a modal se o clique for no fundo escuro, e não na janela em si
        if (event.target === modalOverlay) {
            closeCheckoutModal();
        }
    });
    copyPixBtn.addEventListener('click', copyPixToClipboard);

    fetchProducts();
});