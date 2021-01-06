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

        //jak tu trafiają dane z productdata? nie ma  parametru??
    };

    class Product {
        constructor(id, data) {
            const thisProduct = this;
            thisProduct.id = id;
            thisProduct.data = data;
            thisProduct.renderInMenu();
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

        initAccordion() {
            const thisProduct = this;
            /* find the clickable triggers*/
            const clickableTrigger = thisProduct.element.querySelectorAll(select.menuProduct.clickable);
            /* START: add event listener to clickable trigger on event click */
            for (let trigger of clickableTrigger) {

                trigger.addEventListener('click', function(event) {
                    /*prevent default action */
                    event.preventDefault();
                    /*declaring clicked element*/
                    const clickedElement = this;
                    /* toggle active on clicked element */
                    clickedElement.parentNode.classList.toggle('active');
                    /* remove class 'active' from all article with class that are not parrent clicked element */
                    const activeProducts = document.querySelectorAll('article.active');
                    if (activeProducts) {
                        for (let product of activeProducts) {
                            if (product != clickedElement.parentNode) {
                                product.classList.remove('active');
                            }
                        }
                    }
                });
            }
        }
    }


    const app = {
        //czy zastosowanie thisApp.data nie jest tworzeniem property jak poniżej??
        //data: dataSource;

        initMenu: function() {
            const thisApp = this;
            console.log('thisApp.data:', thisApp.data);

            for (let productData in thisApp.data.products) {
                new Product(productData, thisApp.data.products[productData]);
            }
        },

        /* dlaczego to jest funkcja a nie zwykłe property pobeirające dane z innego obiektu? */
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