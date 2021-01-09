/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
    'use strict';

    const select = {
        templateOf: {
            menuProduct: '#template-menu-product',
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
                input: 'input[name="amount"]',
                linkDecrease: 'a[href="#less"]',
                linkIncrease: 'a[href="#more"]',
            },
        },
    };

    const classNames = {
        menuProduct: {
            wrapperActive: 'active',
            imageVisible: 'active',
        },
    };

    const settings = {
        amountWidget: {
            defaultValue: 1,
            defaultMin: 1,
            defaultMax: 9,
        }
    };

    const templates = {
        menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    };

    class Product {
        constructor(id, data) {
            const thisProduct = this;
            thisProduct.id = id;
            thisProduct.data = data;
            thisProduct.renderInMenu();
            thisProduct.getElements();
            thisProduct.initOrderForm();
            thisProduct.processOrder();
            thisProduct.initAccordion();
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

            thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
            thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
            thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
            thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
            thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
            thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
        }

        initAccordion() {
            const thisProduct = this;
            /* find the clickable trigger*/
            thisProduct.accordionTrigger.addEventListener('click', function(event) {
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
            console.log('initOrderForm');
            thisProduct.form.addEventListener('submit', function(event) {
                event.preventDefault();
                thisProduct.processOrder();
            });
            for (let input of thisProduct.formInputs) {
                input.addEventListener('change', function() {
                    thisProduct.processOrder();
                });
            }
            thisProduct.cartButton.addEventListener('click', function(event) {
                event.preventDefault();
                thisProduct.processOrder();
            });
        }

        processOrder() {
            const thisProduct = this;
            //console.log('processOrder');
            /* convert form to object structure e.g. {sauce: ['tomato'], toppings: ['olives', 'salami']} */
            const formData = utils.serializeFormToObject(thisProduct.form);
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
                    const optionImage = thisProduct.imageWrapper.querySelector("." + paramId + "-" + optionId);
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
                // update calculated price in the HTML
                thisProduct.priceElem.innerHTML = price;
            }
        }
    }


    const app = {

        initMenu: function() {
            const thisApp = this;
            console.log('thisApp.data:', thisApp.data);

            for (let productData in thisApp.data.products) {
                new Product(productData, thisApp.data.products[productData]);
            }
        },

        initData: function() {
            const thisApp = this;
            thisApp.data = dataSource;
        },

        data: dataSource,

        init: function() {
            const thisApp = this;
            console.log('*** App starting ***');
            console.log('thisApp:', thisApp);
            console.log('classNames:', classNames);
            console.log('settings:', settings);
            console.log('templates:', templates);

            thisApp.initData();
            thisApp.initMenu();
        },
    };

    app.init();
}