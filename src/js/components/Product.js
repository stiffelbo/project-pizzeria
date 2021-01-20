import { select, classNames, templates } from '../settings.js';
import AmountWidget from './AmountWidget.js'; //importowanie domyslne
import utils from '../utils.js';

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

        // app.cart.add(thisProduct.prepareCartProduct());

        const event = new CustomEvent('add-to-cart', {
            bubbles: true,
            detail: {
                product: thisProduct,
            },
        });

        thisProduct.element.dispatchEvent(event);
    }
}

export default Product;