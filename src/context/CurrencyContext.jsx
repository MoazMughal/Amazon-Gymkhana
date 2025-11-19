import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Load from localStorage or default to PKR
    return localStorage.getItem('selectedCurrency') || 'PKR';
  });

  // Currency conversion rates (base: PKR)
  const currencyRates = {
    PKR: 1,
    USD: 0.0036,  // 1 PKR = 0.0036 USD
    GBP: 0.0028   // 1 PKR = 0.0028 GBP
  };

  const currencySymbols = {
    PKR: 'Rs',
    USD: '$',
    GBP: '£'
  };

  // Save to localStorage whenever currency changes
  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  const convertPrice = (price) => {
    // Handle different price formats
    let numericPrice = price;
    
    if (typeof price === 'string') {
      numericPrice = parseFloat(price.replace(/[£$₨Rs]/g, '').trim());
    }
    
    if (isNaN(numericPrice)) {
      return `${currencySymbols[currency]}0.00`;
    }

    const converted = numericPrice * currencyRates[currency];
    return converted.toFixed(2);
  };

  const formatPrice = (price) => {
    return `${currencySymbols[currency]}${convertPrice(price)}`;
  };

  const value = {
    currency,
    setCurrency,
    currencyRates,
    currencySymbols,
    convertPrice,
    formatPrice
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
