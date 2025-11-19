# Products.xlsx File Structure

Place your `Products.xlsx` file in the `public` folder.

## Required Columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| **asin** or **ASIN** | Amazon Standard Identification Number | B08N5WRWNW |
| **title** or **Title** | Product title/name | Wireless Bluetooth Headphones |
| **price** or **Price** or **Admin Price** | Product price in PKR | 2500 |
| **category** or **Category** | Product category | Electronics |
| **stock** or **Stock** | Available stock quantity | 100 |

## Optional Columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| originalPrice or Original Price | Original price before discount | 3500 |
| discount or Discount | Discount percentage | 15 |
| description or Description | Product description | High quality wireless headphones |
| brand or Brand | Brand name | Sony |
| rating or Rating | Product rating (1-5) | 4.5 |
| reviews or Reviews | Number of reviews | 250 |

## Example Excel Structure:

```
| ASIN        | Title                      | Admin Price | Category    | Stock |
|-------------|----------------------------|-------------|-------------|-------|
| B08N5WRWNW  | Wireless Headphones        | 2500        | Electronics | 100   |
| B07XYZ123   | Smart Watch                | 3500        | Electronics | 50    |
| B09ABC456   | LED Bulb Pack              | 500         | Home        | 200   |
```

## How to Use:

1. Place `Products.xlsx` in the `public` folder
2. Go to Admin Dashboard → Excel Import
3. Products will load automatically
4. Select products you want to add
5. Click the button for the page you want to add them to:
   - 🏆 Amazon's Choice
   - 🔥 Best Sellers
   - ⚡ Latest Deals
   - 🏠 Home

## Notes:

- All prices should be in PKR (Pakistani Rupees)
- The system will automatically convert to other currencies
- Column names are case-insensitive
- You can also upload a different Excel file using the "Upload Excel" button
