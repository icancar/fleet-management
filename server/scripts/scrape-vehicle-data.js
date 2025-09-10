const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Comprehensive list of major automotive manufacturers
const MAJOR_MANUFACTURERS = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
  "Hyundai",
  "Kia",
  "Mazda",
  "Subaru",
  "Volvo",
  "Lexus",
  "Acura",
  "Infiniti",
  "Cadillac",
  "Lincoln",
  "Jeep",
  "Ram",
  "GMC",
  "Dodge",
  "Chrysler",
  "Buick",
  "Tesla",
  "Porsche",
  "Jaguar",
  "Land Rover",
  "Mitsubishi",
  "Suzuki",
  "Isuzu",
  "Saab",
  "Saturn",
  "Pontiac",
  "Oldsmobile",
  "Mercury",
  "Hummer",
  "Scion",
  "Genesis",
  "Alfa Romeo",
  "Fiat",
  "Maserati",
  "Ferrari",
  "Lamborghini",
  "Bentley",
  "Rolls-Royce",
  "Aston Martin",
  "McLaren",
  "Bugatti",
  "Koenigsegg",
  "Pagani",
  "Rimac",
  "Lucid",
  "Rivian",
  "Polestar",
  "BYD",
  "NIO",
  "Xpeng",
  "Li Auto",
  "Great Wall",
  "Geely",
  "Chery",
  "JAC",
  "Dongfeng",
  "FAW",
  "Changan",
  "Haval",
  "WEY",
  "Lynk & Co",
  "MG",
  "Maxus",
  "Roewe",
  "BAIC",
  "Brilliance",
  "BYD",
  "JMC",
  "SouEast",
  "Zotye",
  "Haima",
  "Lifan",
  "Foton",
  "Tata",
  "Mahindra",
  "Maruti Suzuki",
  "Bajaj",
  "Force",
  "Ashok Leyland",
  "TVS",
  "Hero",
  "Royal Enfield",
  "Yamaha",
  "Honda",
  "Kawasaki",
  "Suzuki",
  "Ducati",
  "KTM",
  "Aprilia",
  "Moto Guzzi",
  "MV Agusta",
  "Triumph",
  "Norton",
  "Harley-Davidson",
  "Indian",
  "Victory",
  "Polaris",
  "Can-Am",
  "Arctic Cat",
  "Ski-Doo",
  "Sea-Doo",
  "Lynx",
  "Yamaha",
  "Honda",
  "Kawasaki",
  "Suzuki",
  "KTM",
  "Husqvarna",
  "GasGas",
  "Beta",
  "Sherco",
  "TM Racing",
  "Fantic",
  "Rieju",
  "GasGas",
  "Husaberg",
  "KTM",
  "Husqvarna",
  "GasGas",
  "Beta",
  "Sherco",
  "TM Racing",
  "Fantic",
  "Rieju",
  "GasGas",
  "Husaberg",
];

// Function to scrape vehicle models from Wikipedia
async function scrapeWikipediaModels(make) {
  try {
    console.log(`Scraping Wikipedia for ${make} models...`);
    const searchUrl = `https://en.wikipedia.org/wiki/List_of_${make.replace(/\s+/g, "_")}_vehicles`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const models = new Set();

    // Look for model names in various table formats
    $("table.wikitable tr").each((i, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 2) {
        const modelCell = $(cells[0]).text().trim();
        if (modelCell && modelCell !== "Model" && modelCell !== "Name") {
          models.add(modelCell);
        }
      }
    });

    // Also look for model names in lists
    $("ul li, ol li").each((i, item) => {
      const text = $(item).text().trim();
      if (text && text.length < 50 && text.length > 2) {
        // Check if it looks like a model name
        if (/^[A-Z][a-zA-Z0-9\s\-]+$/.test(text)) {
          models.add(text);
        }
      }
    });

    return Array.from(models).slice(0, 50); // Limit to 50 models per make
  } catch (error) {
    console.log(`Error scraping Wikipedia for ${make}:`, error.message);
    return [];
  }
}

// Function to scrape from Car and Driver
async function scrapeCarAndDriver(make) {
  try {
    console.log(`Scraping Car and Driver for ${make} models...`);
    const searchUrl = `https://www.caranddriver.com/${make.toLowerCase().replace(/\s+/g, "-")}`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const models = new Set();

    // Look for model names in various selectors
    $(".vehicle-name, .model-name, h3, h4").each((i, element) => {
      const text = $(element).text().trim();
      if (text && text.length < 50 && text.length > 2) {
        models.add(text);
      }
    });

    return Array.from(models).slice(0, 30);
  } catch (error) {
    console.log(`Error scraping Car and Driver for ${make}:`, error.message);
    return [];
  }
}

// Function to scrape from AutoTrader
async function scrapeAutoTrader(make) {
  try {
    console.log(`Scraping AutoTrader for ${make} models...`);
    const searchUrl = `https://www.autotrader.com/cars-for-sale/all-cars/${make.toLowerCase().replace(/\s+/g, "-")}`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const models = new Set();

    // Look for model names in filters or listings
    $(".model-filter, .vehicle-model, .listing-title").each((i, element) => {
      const text = $(element).text().trim();
      if (text && text.length < 50 && text.length > 2) {
        models.add(text);
      }
    });

    return Array.from(models).slice(0, 30);
  } catch (error) {
    console.log(`Error scraping AutoTrader for ${make}:`, error.message);
    return [];
  }
}

// Function to merge and deduplicate model lists
function mergeModels(lists) {
  const allModels = new Set();

  lists.forEach((list) => {
    list.forEach((model) => {
      if (model && typeof model === "string") {
        // Clean up the model name
        const cleanModel = model
          .trim()
          .replace(/\([^)]*\)/g, "") // Remove parentheses content
          .replace(/\[[^\]]*\]/g, "") // Remove brackets content
          .replace(/\d{4}/g, "") // Remove years
          .replace(/\s+/g, " ") // Normalize spaces
          .trim();

        if (cleanModel.length > 1 && cleanModel.length < 50) {
          allModels.add(cleanModel);
        }
      }
    });
  });

  return Array.from(allModels).sort();
}

// Main scraping function
async function scrapeAllVehicleData() {
  console.log("Starting comprehensive vehicle data scraping...");

  const vehicleData = [];
  const totalMakes = MAJOR_MANUFACTURERS.length;

  for (let i = 0; i < totalMakes; i++) {
    const make = MAJOR_MANUFACTURERS[i];
    console.log(`\nProcessing ${make} (${i + 1}/${totalMakes})...`);

    try {
      // Scrape from multiple sources
      const [wikipediaModels, carAndDriverModels, autoTraderModels] =
        await Promise.allSettled([
          scrapeWikipediaModels(make),
          scrapeCarAndDriver(make),
          scrapeAutoTrader(make),
        ]);

      // Extract successful results
      const modelLists = [];
      if (wikipediaModels.status === "fulfilled")
        modelLists.push(wikipediaModels.value);
      if (carAndDriverModels.status === "fulfilled")
        modelLists.push(carAndDriverModels.value);
      if (autoTraderModels.status === "fulfilled")
        modelLists.push(autoTraderModels.value);

      // Merge and deduplicate models
      const mergedModels = mergeModels(modelLists);

      if (mergedModels.length > 0) {
        vehicleData.push({
          name: make,
          models: mergedModels,
        });
        console.log(`✓ Found ${mergedModels.length} models for ${make}`);
      } else {
        console.log(`⚠ No models found for ${make}`);
      }

      // Add delay to be respectful to servers
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`✗ Error processing ${make}:`, error.message);
    }
  }

  return vehicleData;
}

// Function to save data to file
function saveVehicleData(data) {
  const outputPath = path.join(
    __dirname,
    "../shared/src/data/scrapedVehicleData.json"
  );

  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(outputPath, jsonData);

  console.log(`\n✓ Vehicle data saved to ${outputPath}`);
  console.log(`Total makes: ${data.length}`);
  console.log(
    `Total models: ${data.reduce((sum, make) => sum + make.models.length, 0)}`
  );
}

// Run the scraper
async function main() {
  try {
    const vehicleData = await scrapeAllVehicleData();
    saveVehicleData(vehicleData);

    console.log("\n🎉 Vehicle data scraping completed successfully!");
  } catch (error) {
    console.error("❌ Error during scraping:", error);
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

module.exports = { scrapeAllVehicleData, saveVehicleData };
