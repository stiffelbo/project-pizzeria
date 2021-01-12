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
            thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget)
        }

        initAccordion() {
            const thisProduct = this;
            /* find the clickable trigger*/
            thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
                /*prevent default action */
                event.preventDefault();
                /*declaring clicked element*/
                const clickedElement = this;
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
                    const optionImage = thisProduct.dom.imageWrapper.querySelector("." + paramId + "-" + optionId);
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
                    //console.log('param.options[optionId]: ', param.options[optionId]);
                    // console.log('optionId: ', optionId);
                    const option = param.options[optionId];
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
        }

        initActions() {
            const thisWidget = this;
            thisWidget.input.addEventListener('change', function() {
                thisWidget.setValue(thisWidget.input.value)
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
        }

        initActions() {
            const thisCart = this;
            thisCart.dom.toggleTrigger.addEventListener('click', function() {

                thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
            });
            thisCart.dom.productList.addEventListener('updated', function() {
                thisCart.update();
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

            const deliveryFee = settings.cart.defaultDeliveryFee;

            let totalNumber = 0;
            let subtotalPrice = 0;
            thisCart.totalPrice = 0;

            for (let product of thisCart.products) {
                console.log(product);
                subtotalPrice += product.price;
                totalNumber += (product.price / product.priceSingle);
            }
            if (subtotalPrice > 0) {
                thisCart.totalPrice = subtotalPrice + deliveryFee;
                thisCart.dom.totalNumber.innerHTML = totalNumber;
                thisCart.dom.deliveryFee.innerHTML = deliveryFee;
                thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
                for (let dom of thisCart.dom.totalPrice) {
                    dom.innerHTML = thisCart.totalPrice;
                }
            }
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

            thisCartProduct.getElements(element);
            thisCartProduct.initAmountWidget();

            //console.log(thisCartProduct);
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

    }

    const app = {

        initMenu: function() {
            const thisApp = this;
            //console.log('thisApp.data:', thisApp.data);

            for (let productData in thisApp.data.products) {
                new Product(productData, thisApp.data.products[productData]);
            }
        },

        initData: function() {
            const thisApp = this;
            thisApp.data = dataSource;
        },

        data: dataSource,

        initCart: function() {
            const thisApp = this;

            const cartElem = document.querySelector(select.containerOf.cart);
            //console.log(cartElem);
            thisApp.cart = new Cart(cartElem);
        },

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
            thisApp.initMenu();
            thisApp.initCart();
        },
    };

    app.init();
}