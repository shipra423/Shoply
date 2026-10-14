
import { seedProducts } from "./data";

// Simulated API request
export const fetchProducts = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Change to true temporarily to test error state
      const simulateError = false;

      if (simulateError) {
        reject(new Error("Unable to load products. Please try again."));
      } else {
        resolve(seedProducts);
      }
    }, 1200);
  });
};
