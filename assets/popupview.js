document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.quick-view').forEach(function (link) {
    // Generate a random top position between -10px and +10px
    var randomTopOffset = Math.random() * 20 - 10; // Random number between -10 and 10
    link.style.top = `calc(50% + ${randomTopOffset}px)`; // Adjust '50%' to your base top position as needed

    link.addEventListener('click', function (e) {
      e.preventDefault();

      var productHandle = this.getAttribute('data-handle');
      console.log('Fetching product data for handle:', productHandle);

      fetch('/products/' + productHandle + '.js')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(product => {
          console.log('Product data fetched:', product);

          var modalTitle = document.querySelector('.modal-title');
          var modalBody = document.querySelector('.modal-body');
          var imagesContainer = modalBody.querySelector('.product-images');
          var productPrice = modalBody.querySelector('.product-price');
          var productDescription = modalBody.querySelector('.product-description');
          var productVariants = modalBody.querySelector('.product-variants');
          var addToCartButton = document.querySelector('.modal-footer .add-to-cart');

          if (modalTitle) {
            modalTitle.innerText = product.title;
          }
          if (productPrice) {
            productPrice.innerText = `$${(product.variants[0].price / 100).toFixed(2)}`;
          }
          if (productDescription) {
            productDescription.innerHTML = product.description;
          }
          if (imagesContainer) {
            imagesContainer.innerHTML = '';
            product.images.forEach(image => {
              var imgElement = document.createElement('img');
              imgElement.src = image.replace('.jpg', '_800x.jpg').replace('.png', '_800x.png');
              imgElement.alt = product.title;
              imagesContainer.appendChild(imgElement);
            });
          }

          if (productVariants) {
            productVariants.innerHTML = '';

            product.options.forEach(option => {
              if (option.name.toLowerCase() === 'color') {
                var colorOptions = document.createElement('div');
                colorOptions.classList.add('color-options');
                colorOptions.innerHTML = '<h5>Color</h5>';
                option.values.forEach(value => {
                  var label = document.createElement('label');
                  label.innerHTML = `
                    <input type="radio" name="color" value="${value}" /> ${value}
                  `;
                  colorOptions.appendChild(label);
                });
                productVariants.appendChild(colorOptions);
              } else if (option.name.toLowerCase() === 'size') {
                var sizeOptions = document.createElement('div');
                sizeOptions.classList.add('size-options');
                sizeOptions.innerHTML = '<h5>Size</h5>';
                var select = document.createElement('select');
                select.name = 'size';
                select.innerHTML = '<option value="">Choose your size</option>'; // Default option

                option.values.forEach(value => {
                  var optionElement = document.createElement('option');
                  optionElement.value = value;
                  optionElement.innerText = value;
                  select.appendChild(optionElement);
                });

                sizeOptions.appendChild(select);
                productVariants.appendChild(sizeOptions);

                // Set default size option if available
                if (option.values.length > 0) {
                  select.value = option.values[0]; // Default to the first available size
                }
              }
            });
          }

          function getSelectedVariantId() {
            var selectedOptions = {};
            var selectedColor = document.querySelector('input[name="color"]:checked')?.value;
            var selectedSizeElement = document.querySelector('select[name="size"]');
            var selectedSize = selectedSizeElement ? selectedSizeElement.value : '';

            if (selectedColor) {
              selectedOptions['Color'] = selectedColor;
            }
            if (selectedSize) {
              selectedOptions['Size'] = selectedSize;
            }

            console.log('Selected options:', selectedOptions);

            if (product.variants.length === 1) {
              // If there's only one variant, return its ID directly
              return product.variants[0].id;
            }

            var selectedVariant = product.variants.find(variant => {
              console.log('Checking variant:', variant);
              var variantOptions = variant.options.map(option => option.trim().toLowerCase());
              return Object.entries(selectedOptions).every(([key, value]) => {
                return variantOptions.includes(value.toLowerCase());
              });
            });

            console.log('Selected variant:', selectedVariant);
            console.log('Selected variant ID:', selectedVariant ? selectedVariant.id : null);

            return selectedVariant ? selectedVariant.id : null;
          }

          if (addToCartButton) {
            addToCartButton.onclick = function () {
              var selectedVariantId = getSelectedVariantId();
              if (selectedVariantId) {
                fetch('/cart/add.js', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    id: selectedVariantId,
                    quantity: 1
                  })
                })
                .then(response => response.json())
                .then(data => {
                  console.log('Product added to cart:', data);

                  // Redirect to the cart page after adding the product
                  window.location.href = '/cart';
                })
                .catch(error => {
                  console.error('Error adding product to cart:', error);
                });
              } else {
                console.error('No variant selected');
                // Handle the case where there are no variants or no variant is selected
                if (product.variants.length === 1) {
                  // If only one variant, add it to the cart directly
                  fetch('/cart/add.js', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      id: product.variants[0].id,
                      quantity: 1
                    })
                  })
                  .then(response => response.json())
                  .then(data => {
                    console.log('Product added to cart:', data);
                    window.location.href = '/cart';
                  })
                  .catch(error => {
                    console.error('Error adding product to cart:', error);
                  });
                }
              }
            };
          }

          var myModal = new bootstrap.Modal(document.getElementById('quickViewModal'));
          myModal.show();
        })
        .catch(error => {
          console.error('Error fetching product data:', error);
        });
    });
  });
});
