import { select, classNames, templates, settings } from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js'; //importowanie domyslne

class Cart {
    constructor(element) {
        const thisCart = this;

        thisCart.products = [];

        thisCart.getElements(element);
        thisCart.initActions();

        //console.log('new Cart', thisCart);
    }

    getElements(element) {
        const thisCart = this;

        thisCart.dom = {};

        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = element.querySelector(select.cart.productList);
        thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
        thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
        thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
        thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
        thisCart.dom.form = element.querySelector(select.cart.form);
        thisCart.dom.address = element.querySelector(select.cart.address);
        thisCart.dom.phone = element.querySelector(select.cart.phone);
    }

    initActions() {
        const thisCart = this;
        thisCart.dom.toggleTrigger.addEventListener('click', function() {

            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });
        thisCart.dom.productList.addEventListener('updated', function() {
            thisCart.update();
        });

        thisCart.dom.productList.addEventListener('remove', function(event) {
            thisCart.remove(event.detail.cartProduct);
        });

        thisCart.dom.form.addEventListener('submit', function(event) {
            event.preventDefault();
            thisCart.sendOrder();
        });
    }

    add(menuProduct) {
        const thisCart = this;

        /*generate HTML based on template - this is only text by now*/
        const generatedHTML = templates.cartProduct(menuProduct);

        /*create element using utils.createElementFromHTML*/
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        /*append cild generatedDOM to cart product list*/
        thisCart.dom.productList.appendChild(generatedDOM);

        /*push selected product to thisCart.products */
        thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
        thisCart.update();
    }

    update() {
        const thisCart = this;

        //sprawdź kolejność wykonywanych zadań.

        const deliveryFee = settings.cart.defaultDeliveryFee;

        let totalNumber = 0;
        let subtotalPrice = 0;
        thisCart.totalPrice = 0;

        for (let product of thisCart.products) {

            console.log('update product.amountWidget: ', product.amountWidget.value);
            console.log('update product.amount: ', product.amount);

            subtotalPrice += product.priceSingle * product.amountWidget.value;
            totalNumber += parseInt(product.amountWidget.value);
        }
        //update TotalPrice only if subtotal is > 0
        if (subtotalPrice > 0) {
            thisCart.totalPrice = subtotalPrice + deliveryFee;
        }
        //print totalNumber DOM element
        thisCart.dom.totalNumber.innerHTML = totalNumber;
        //print deliveryFee DOM element
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
        //print subtotalPrice DOM element
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
        //add subtotalPrice as object property
        thisCart.subtotalPrice = subtotalPrice;
        //print totalPrice to all DOM elements of totalPrice
        for (let dom of thisCart.dom.totalPrice) {
            dom.innerHTML = thisCart.totalPrice;
        }
    }

    remove(details) {
        const thisCart = this;
        /* remove item from thisCart.products */
        thisCart.products.splice(thisCart.products.indexOf(details), 1);
        thisCart.update();

    }

    sendOrder() {
        const thisCart = this;
        //preparing url for request
        const url = settings.db.url + '/' + settings.db.order;
        //preparing payload - order object
        const payload = {
            address: thisCart.dom.address.value,
            phone: thisCart.dom.phone.value,
            totalPrice: thisCart.totalPrice,
            subtotalPrice: thisCart.subtotalPrice,
            totalNumber: parseInt(thisCart.dom.totalNumber.innerHTML),
            deliveryFee: thisCart.dom.deliveryFee.innerHTML,
            products: [],
        };
        //add products data to array using getData() method
        for (let prod of thisCart.products) {
            payload.products.push(prod.getData());
        }

        //preparing options data for request
        const options = {
            //indicate request method
            method: 'POST',
            //indicate headers
            headers: {
                'Content-Type': 'application/json',
            },
            //convert payload obj to JSON
            body: JSON.stringify(payload),
        };
        //making request  
        fetch(url, options)
            .then(function(response) {
                return response.json();
            })
            .then(function(parsedResponse) {
                console.log('parsedResponse: ', parsedResponse);
            });
    }
}

export default Cart;