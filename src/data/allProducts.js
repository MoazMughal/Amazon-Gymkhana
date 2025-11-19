// Import all extracted products from Amazon's Choice.html
import extractedProducts from './extracted-products.json';
import { processProductImages } from '../utils/imageImports';
import { addProfitDataToProducts } from '../utils/addProfitData';

// Remove duplicate products based on ID and keep only unique ones
const removeDuplicates = (products) => {
  const seen = new Set();
  return products.filter(product => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
};

// Process all products to convert image paths to imported URLs
let processedProducts = processProductImages(extractedProducts);

// Remove duplicates to prevent category filter issues
processedProducts = removeDuplicates(processedProducts);

// Add profit data to specific product categories (nose rings, bulbs, fuses, lampshades)
processedProducts = addProfitDataToProducts(processedProducts);

// Export the products array
export const allProducts = processedProducts;

// Generate more products to ensure we have enough variety
const generateMoreProducts = () => {
  const baseProducts = [...processedProducts];
  return baseProducts;
};

export const products = generateMoreProducts();

export default products;
