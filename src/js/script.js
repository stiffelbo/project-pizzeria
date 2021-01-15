/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
    'use strict';

    const select = {
        templateOf: {
            menuProduct: '#template-menu-product',
            cartProduct: '#template-cart-product', // CODE ADDED
        },
        containerOf: {
            menu: '#product-list',
            cart: '#cart',
        },
        all: {
            menuProducts: '#product-list > .product',
            menuProductsActive: '#product-list > .product.active',
            formInputs: 'input, select',
        },
        menuProduct: {
            clickable: '.product__header',
            form: '.product__order',
            priceElem: '.product__total-price .price',
            imageWrapper: '.product__images',
            amountWidget: '.widget-amount',
            cartButton: '[href="#add-to-cart"]',
        },
        widgets: {
            amount: {
                input: 'input.amount', // CODE CHANGED
                linkDecrease: 'a[href="#less"]',
                linkIncrease: 'a[href="#more"]',
            },
        },
        // CODE ADDED START
        cart: {
            productList: '.cart__order-summary',
            toggleTrigger: '.cart__summary',
            totalNumber: `.cart__total-number`,
            totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
            subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
            deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
            form: '.cart__order',
            formSubmit: '.cart__order [type="submit"]',
            phone: '[name="phone"]',
            address: '[name="address"]',
        },
        cartProduct: {
            amountWidget: '.widget-amount',
            price: '.cart__product-price',
            edit: '[href="#edit"]',
            remove: '[href="#remove"]',
        },
        // CODE ADDED END
    };

    const classNames = {
        menuProduct: {
            wrapperActive: 'active',
            imageVisible: 'active',
        },
        // CODE ADDED START
        cart: {
            wrapperActive: 'active',
        },
        // CODE ADDED END
    };

    const settings = {
        amountWidget: {
            defaultValue: 1,
            defaultMin: 1,
            defaultMax: 9,
        }, // CODE CHANGED
        // CODE ADDED START
        cart: {
            defaultDeliveryFee: 20,
        },
        db: {
            url: '//localhost:3131',
            product: 'products',
            order: 'order',
        },
        // CODE ADDED END
    };

    const templates = {
        menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
        // CODE ADDED START
        cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
        // CODE ADDED END
    };

    class Product {
        constructor(id, data) {
            const thisProduct = this;
            thisProduct.id = id;
            thisProduct.data = data;
            thisProduct.renderInMenu();
            thisProduct.getElements();
            thisProduct.initAccordion();
            thisProduct.initOrderForm();
            thisProduct.initAmountWidget();
            thisProduct.processOrder();
            //console.log('new Product:', thisProduct);
        }
        renderInMenu() {
            const thisProduct = this;

            /*generate HTML based on template - this is only text by now*/
            const generatedHTML = templates.menuProduct(thisProduct.data);
            /*create element using utils.createElementFromHTML*/
            thisProduct.element = utils.createDOMFromHTML(generatedHTML);
            /*find menu container*/
            const menuContainer = document.querySelector(select.containerOf.menu);
            /*add element to menu*/
            menuContainer.appendChild(thisProduct.element);
        }

        getElements() {
            const thisProduct = this;
            thisProduct.dom = {};

            thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
            thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
            thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
            thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
            thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
            thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
            thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
        }

        initAccordion() {
            const thisProduct = this;
            /* find the clickable trigger*/
            thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
                /*prevent default action */
                event.preventDefault();
                /* toggle active on clicked element */
                thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
                /* remove class 'active' from all article with class that are not parrent of clicked element */
                const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
                if (activeProducts) {
                    for (let product of activeProducts) {
                        if (product != thisProduct.element) {
                            product.classList.remove(classNames.menuProduct.wrapperActive);
                        }
                    }
                }
            });
        }

        initOrderForm() {
            const thisProduct = this;
            // console.log('initOrderForm');
            thisProduct.dom.form.addEventListener('submit', function(event) {
                event.preventDefault();
                thisProduct.processOrder();
            });
            for (let input of thisProduct.dom.formInputs) {
                input.addEventListener('change', function() {
                    thisProduct.processOrder();
                });
            }
            thisProduct.dom.cartButton.addEventListener('click', function(event) {
                event.preventDefault();
                thisProduct.processOrder();
                thisProduct.addToCart();
            });
        }

        initAmountWidget() {
            const thisProduct = this;
            thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
            thisProduct.dom.amountWidgetElem.addEventListener('updated', function() {
                thisProduct.processOrder();
            });
        }

        processOrder() {
            const thisProduct = this;

            /* convert form to object structure e.g. {sauce: ['tomato'], toppings: ['olives', 'salami']} */
            const formData = utils.serializeFormToObject(thisProduct.dom.form);
            //console.log('form', formData);

            /*set price to default price - ta zmienną bedziemy nadpisywac nową ceną*/
            let price = thisProduct.data.price;

            // for every category (param)...
            for (let paramId in thisProduct.data.params) {
                // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
                const param = thisProduct.data.params[paramId];
                // for every option in this category
                for (let optionId in param.options) {
                    // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
                    const option = param.options[optionId];
                    //getting image element of option
                    const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
                    //remove class that makes elem visible
                    if (optionImage) {
                        optionImage.classList.remove(classNames.menuProduct.imageVisible);
                    }
                    const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
                    //if checked option is not default add option price to price

                    if (optionSelected && !option.default) { // nie mozesz sie dostać formData.paramId przez dot notation poniewaz klucz jet przekazywany w zmiennej, formData nie ma własności paramId.
                        price = price + option.price;
                    }
                    //if default option is not checked subtract option price from price                   
                    if (!optionSelected && option.default) {
                        price = price - option.price;
                    }
                    //if option is checked and has image add class that makes img visible
                    if (optionSelected && optionImage) {
                        optionImage.classList.add(classNames.menuProduct.imageVisible);
                    }
                }
            }
            thisProduct.priceSingle = price;
            //multiply price by amount
            price *= thisProduct.amountWidget.value;
            // update calculated price in the HTML

            thisProduct.dom.priceElem.innerHTML = price;
        }
        prepareCartProduct() {
            const thisProduct = this;
            const productSummary = {
                id: thisProduct.id,
                name: thisProduct.data.name,
                amount: thisProduct.amountWidget.value,
                priceSingle: thisProduct.priceSingle,
                price: thisProduct.priceSingle * thisProduct.amountWidget.value,
                params: thisProduct.prepareCartProductParams()
            };

            console.log(productSummary);
            return productSummary;
        }

        prepareCartProductParams() {
            const thisProduct = this;
            const cartProductParams = {};
            const formData = utils.serializeFormToObject(thisProduct.dom.form);
            // for every category (param)
            for (let paramId in thisProduct.data.params) {

                const param = thisProduct.data.params[paramId];
                //console.log('Param: ', param);
                //console.log('ParamId: ', paramId);
                // for every option in this category
                for (let optionId in param.options) {

                    const paramSelected = formData[paramId];

                    const optionSelected = paramSelected && formData[paramId] && formData[paramId].includes(optionId);
                    if (optionSelected) {
                        if (!cartProductParams[paramId]) {
                            cartProductParams[paramId] = {
                                'label': thisProduct.data.params[paramId].label
                            };
                            cartProductParams[paramId]['options'] = {};
                            cartProductParams[paramId]['options'][optionId] = param.options[optionId].label;
                        } else {
                            cartProductParams[paramId]['options'][optionId] = param.options[optionId].label;
                        }
                    }
                }
            }

            return cartProductParams;

        }

        addToCart() {
            const thisProduct = this;

            app.cart.add(thisProduct.prepareCartProduct());
        }
    }

    class AmountWidget {
        constructor(element) {
            const thisWidget = this;
            thisWidget.value = settings.amountWidget.defaultValue; //dane pobieram z objektu settings
            //przez to w koszyku po kliknięciu w +- wartość licozna jest od 1.
            //powinna byc zczytywana z domu lub z obiektu.
            thisWidget.getElements(element);
            thisWidget.initActions();
            //update widget value if not the same as in input, simple compare

            if (thisWidget.input.value != thisWidget.value) {
                thisWidget.value = parseInt(thisWidget.input.value);
            }

            //console.log('AmountWidget ', thisWidget);
            //console.log('constructor arguments:', element);
            //console.log("initial value ", thisWidget.value);
        }

        getElements(element) {
            const thisWidget = this;

            thisWidget.element = element;
            thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
            thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
            thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
        }

        setValue(value) {
            const thisWidget = this;
            const newValue = parseInt(value);
            //TODO: Add validation
            const isNewValue = thisWidget.value !== newValue && !isNaN(newValue);
            if (isNewValue && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
                thisWidget.value = newValue;
                thisWidget.announce();
            }
            thisWidget.input.value = thisWidget.value;
            thisWidget.announce();
        }

        initActions() {
            const thisWidget = this;
            thisWidget.input.addEventListener('change', function() {
                thisWidget.setValue(thisWidget.input.value);
                console.log('Amount widget: change', thisWidget.input.value);
            });
            thisWidget.linkDecrease.addEventListener('click', function(event) {
                event.preventDefault();
                thisWidget.setValue(thisWidget.value - 1);

            });
            thisWidget.linkIncrease.addEventListener('click', function(event) {
                event.preventDefault();
                thisWidget.setValue(thisWidget.value + 1);
            });
        }

        announce() {
            const thisWidget = this;

            const event = new CustomEvent('updated', {
                bubbles: true
            });
            thisWidget.element.dispatchEvent(event);
        }
    }

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

    class CartProduct {
        constructor(menuProduct, element) {
            const thisCartProduct = this;
            thisCartProduct.id = menuProduct.id;
            thisCartProduct.name = menuProduct.name;
            thisCartProduct.params = menuProduct.params;
            thisCartProduct.priceSingle = menuProduct.priceSingle;
            thisCartProduct.price = menuProduct.price;
            thisCartProduct.amount = menuProduct.amount;

            thisCartProduct.getElements(element);
            thisCartProduct.initAmountWidget();
            thisCartProduct.initActions();

            console.log(thisCartProduct);
        }

        getElements(element) {
            const thisCartProduct = this;
            thisCartProduct.dom = {};

            thisCartProduct.dom.wrapper = element;
            thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
            thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
            thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
            thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
        }

        initAmountWidget() {
            const thisCartProduct = this;

            thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
            thisCartProduct.dom.amountWidget.addEventListener('click', function() {
                thisCartProduct.amount = thisCartProduct.amountWidget.value;
                thisCartProduct.price = thisCartProduct.amountWidget.value * thisCartProduct.priceSingle;
                thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
            });
        }

        remove() {
            const thisCartProduct = this;

            const event = new CustomEvent('remove', {
                bubbles: true,
                detail: {
                    cartProduct: thisCartProduct,
                }
            });

            thisCartProduct.dom.wrapper.dispatchEvent(event);
            thisCartProduct.dom.wrapper.remove();
        }

        initActions() {
            const thisCartProduct = this;

            thisCartProduct.dom.edit.addEventListener('click', function(event) {
                event.preventDefault();
            });

            thisCartProduct.dom.remove.addEventListener('click', function(event) {
                event.preventDefault();
                thisCartProduct.remove();
            });
        }

        getData() {
            const thisCartProduct = this;
            return {
                id: thisCartProduct.id,
                amount: thisCartProduct.amount,
                price: thisCartProduct.price,
                priceSingle: thisCartProduct.priceSingle,
                name: thisCartProduct.name,
                params: thisCartProduct.params
            }
        }

    }

    const app = {
        //iterate thru all products in data.products, instantiate Product for evry
        initMenu: function() {
            const thisApp = this;
            //console.log('thisApp.data:', thisApp.data);

            for (let productData in thisApp.data.products) {
                new Product(productData, thisApp.data.products[productData]);
            }
        },
        //colectd initial product data from object dataSource
        initData: function() {
            const thisApp = this;
            const url = settings.db.url + '/' + settings.db.product;
            thisApp.data = {};

            fetch(url).then(function(rawResponse) {
                return rawResponse.json();
            }).
            then(function(parsedResponse) {
                console.log('parsedResponse', parsedResponse);
                /* save parsedResponse as thisApp.data.products */
                thisApp.data.products = parsedResponse;
                /*Execute initMenu method */
                thisApp.initMenu();
            });
        },

        //instantiate Cart
        initCart: function() {
            const thisApp = this;

            const cartElem = document.querySelector(select.containerOf.cart);
            //console.log(cartElem);
            thisApp.cart = new Cart(cartElem);
        },



        //initialize app methods
        init: function() {
            const thisApp = this;
            /* 
                              console.log('*** App starting ***');
                              console.log('thisApp:', thisApp);
                              console.log('classNames:', classNames);
                              console.log('settings:', settings);
                              console.log('templates:', templates);
                              */
            thisApp.initData();
            thisApp.initCart();
        },
    };
    app.init();
}