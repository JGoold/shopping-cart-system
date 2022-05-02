// connection to Contentful (real values are redacted)
const client = contentful.createClient({
	space: "redacted key",
	accessToken: "redacted key"
})

// set up all the necessary variables

const cartBtn = document.querySelector(".cart-btn")
const closeCartBtn = document.querySelector(".close-cart")
const clearCartBtn = document.querySelector(".clear-cart")
const cartDOM = document.querySelector(".cart")
const cartOverlay = document.querySelector(".cart-overlay")
const cartItems = document.querySelector(".cart-items")
const cartTotal = document.querySelector(".cart-total")
const cartContent = document.querySelector(".cart-content")
const productsDOM = document.querySelector(".products")

const checkout = document.querySelector(".checkout-btn")

let cartClass

let cart = []
let buttonsDOM = []

let tracker

let products

class Products {
	// static method that gets the products from Contentful and destructures each item into usable product objects
	static async getProducts() {
		try {
			let contentful = await client.getEntries({
				content_type: "product"
			})
			let fetchedProducts = contentful.items
			fetchedProducts = fetchedProducts.map(item => {
				const { title, price, type, details } = item.fields
				const { id } = item.sys
				const image = item.fields.image.fields.file.url
				return { title, price, type, details, id, image }
			})
			return fetchedProducts
		} catch (error) {
			console.log(error)
		}
	}
}

class UI {
	// static method that displays the products to the html page
	static displayProducts(products) {
		let result = ""
		products.forEach(product => {
			result += `
            <div class="product" data-type=${product.type}>
                <div class="image-area">
                    <img src=${product.image} alt="product" class="product-img">
                    <button class="cart-add-btn" data-id=${product.id}>
                        <ion-icon class="item-cart" name="cart-sharp"></ion-icon>
                        Add to Cart
                    </button>
                    <h3>${product.details}</h3>
                </div>
                <div class="text-container">
                    <h3>${product.title}</h3>
                    <h4 class="expand-btn">More Details</h4>
                </div>
                <div><h3>£<span class="price">${product.price}</span></h3></div>
            </div>
            `
		})
		productsDOM.innerHTML = result
	}
	// method that filters products by category
	filter() {
		const filter = document.querySelectorAll(".filter")
		const option = document.querySelectorAll(".option")
		const all = document.querySelector(".all")
		const allOption = document.querySelector(".all-option")
		tracker = [
			{ name: "laptop", active: false },
			{ name: "phone", active: false },
			{ name: "under 500", active: false }
		]

		all.addEventListener("click", () => restore())
		allOption.addEventListener("click", () => restore())
		function restore() {
			allProducts.forEach(product => (product.style.display = "block"))
			tracker.forEach(entry => (entry.active = false))
			filter.forEach(entry => entry.classList.remove("active"))
		}

		let conditions

		const allProducts = document.querySelectorAll(".product")
		const price = document.querySelectorAll(".price")

		let options = false
		for (let i = 0; i < filter.length; i++) {
			filter[i].addEventListener("click", () => applyFilter(i))
			option[i].addEventListener("click", () => {
				options = true
				applyFilter(i)
			})
			function applyFilter(i) {
				filter[i].classList.toggle("active")
				if (options) filter[i].classList.add("active")
				conditions = ["laptop", "phone"]
				allProducts.forEach(product => (product.style.display = "block"))
				if (!tracker[i].active || options) {
					if (i === 2) {
						price.forEach((price, x) => {
							let value = parseFloat(price.innerText)
							if (value > 500) allProducts[x].style.display = "none"
						})
					} else {
						allProducts.forEach(product => {
							let type = product.dataset.type
							if (type !== conditions[i]) product.style.display = "none"
						})
					}
					tracker[i].active = true
					options = false
				} else tracker[i].active = false
				tracker.forEach(entry => {
					if (entry !== tracker[i]) entry.active = false
				})
				filter.forEach(entry => {
					if (entry !== filter[i]) entry.classList.remove("active")
				})
			}
		}
	}
}

class Cart {
	// method that gets the cart buttons and adds event listeners to each; inside the event listener many functions run
	getCartButtons() {
		const buttons = [...document.querySelectorAll(".cart-add-btn")]
		buttonsDOM = buttons
		buttons.forEach(button => {
			let id = button.dataset.id
			let inCart = cart.find(item => item.id === id)
			if (inCart) {
				button.innerText = "In Cart"
				button.disabled = true
			}
			button.addEventListener("click", event => {
				event.target.innerText = "In Cart"
				event.target.disabled = true
				let cartItem = { ...Storage.getProducts(id), amount: 1 }
				cart = [...cart, cartItem]
				Storage.saveCart(cart)
				this.setCartValues(cart)
				this.addCartItem(cartItem)
				this.showCart()
			})
		})
	}
	// method that gets the expand buttons and adds event listeners to each
	getProductButtons() {
		const expandBtn = document.querySelectorAll(".expand-btn")
		expandBtn.forEach(button => {
			let active = false
			button.addEventListener("click", event => {
				event.stopPropagation()
				button.parentElement.parentElement.classList.toggle("details")
				button.innerText = "Hide Details"
				if (active) {
					button.innerText = "More Details"
					active = false
				} else active = true
				document.addEventListener("click", event => {
					event.stopPropagation()
					button.parentElement.classList.remove("details")
				})
			})
		})
	}
	// method that sets the cart values/subtotal
	setCartValues(cart) {
		let tempTotal = 0
		let itemsTotal = 0
		cart.map(item => {
			tempTotal += item.price * item.amount
			itemsTotal += item.amount
		})
		cartTotal.innerText = parseFloat(tempTotal.toFixed(2))
		cartItems.innerText = itemsTotal
	}
	// method that generates the item clicked on to the cart html
	addCartItem(item) {
		const div = document.createElement("div")
		div.classList.add("cart-item")
		div.innerHTML = `
        <img src=${item.image} alt="product">
        <div>
            <h4>${item.title}</h4>
            <h5>£${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <ion-icon class="up-icon" name="chevron-up-sharp" data-id=${item.id}></ion-icon>
            <p class="item-amount">${item.amount}</p>
            <ion-icon class="down-icon" name="chevron-down-sharp" data-id=${item.id}></ion-icon>
        </div>
        `
		cartContent.appendChild(div)
	}
	// method that shows the cart when clicked
	showCart() {
		cartOverlay.classList.add("transparent-background")
		cartDOM.classList.add("showCart")
	}
	// method that gets all the values and display each time the page is loaded
	setupAPP() {
		cart = Storage.getCart()
		this.setCartValues(cart)
		this.populateCart(cart)
		cartBtn.addEventListener("click", this.showCart)
		closeCartBtn.addEventListener("click", this.hideCart)
		cartOverlay.addEventListener("click", this.hideCart)
	}
	// method that adds each item that is in the cart localStorage to the cart html
	populateCart(cart) {
		cart.forEach(item => this.addCartItem(item))
	}
	// method that hides the cart when clicked
	hideCart() {
		cartOverlay.classList.remove("transparent-background")
		cartDOM.classList.remove("showCart")
	}
	// method that contains all the cart logic. removing, increasing and decreasing using event bubbling
	cartLogic() {
		clearCartBtn.addEventListener("click", () => {
			this.clearCart()
		})
		cartContent.addEventListener("click", event => {
			if (event.target.classList.contains("remove-item")) {
				let removeItem = event.target
				let id = removeItem.dataset.id
				cartContent.removeChild(removeItem.parentElement.parentElement)
				this.removeItem(id)
			} else if (event.target.classList.contains("up-icon")) {
				let addAmount = event.target
				let id = addAmount.dataset.id
				let tempItem = cart.find(item => item.id === id)
				tempItem.amount += 1
				Storage.saveCart(cart)
				this.setCartValues(cart)
				addAmount.nextElementSibling.innerText = tempItem.amount
			} else if (event.target.classList.contains("down-icon")) {
				let lowerAmount = event.target
				let id = lowerAmount.dataset.id
				let tempItem = cart.find(item => item.id === id)
				tempItem.amount -= 1
				if (tempItem.amount > 0) {
					Storage.saveCart(cart)
					this.setCartValues(cart)
					lowerAmount.previousElementSibling.innerText = tempItem.amount
				} else {
					cartContent.removeChild(lowerAmount.parentElement.parentElement)
					this.removeItem(id)
				}
			}
		})
	}
	// method that clears the cart of all items
	clearCart() {
		let cartItems = cart.map(item => item.id)
		cartItems.forEach(id => this.removeItem(id))
		while (cartContent.children.length > 0) cartContent.removeChild(cartContent.children[0])
		this.hideCart()
	}
	// method that removes an item
	removeItem(id) {
		cart = cart.filter(item => item.id !== id)
		this.setCartValues(cart)
		Storage.saveCart(cart)
		let button = this.getSingleButton(id)
		button.disabled = false
		button.innerHTML = `<ion-icon name="cart"></ion-icon>Add to Cart`
	}
	getSingleButton(id) {
		return buttonsDOM.find(button => button.dataset.id === id)
	}
}

class Storage {
	// static method that saves the products
	static saveProducts(products) {
		localStorage.setItem("products", JSON.stringify(products))
	}
	// static method that gets the products
	static getProducts(id) {
		let products = JSON.parse(localStorage.getItem("products"))
		return products.find(product => product.id === id)
	}
	// static method that saves the cart
	static saveCart(cart) {
		localStorage.setItem("cart", JSON.stringify(cart))
	}
	// static method that gets the cart
	static getCart() {
		return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : []
	}
}

// initial app setup
document.addEventListener("DOMContentLoaded", () => {
	const ui = new UI()
	const products = new Products()
	cartClass = new Cart()
	cartClass.setupAPP()
	Products.getProducts(products)
		.then(products => {
			UI.displayProducts(products)
			ui.filter(products)
			Storage.saveProducts(products)
		})
		.then(() => {
			cartClass.getCartButtons()
			cartClass.getProductButtons()
			cartClass.cartLogic()
		})
})
