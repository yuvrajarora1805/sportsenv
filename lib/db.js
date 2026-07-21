import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'inventory.json');

// Initialize JSON db if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

export const getInventory = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

export const addInventoryItem = (item) => {
  const inventory = getInventory();
  const newItem = {
    id: Date.now(), // Generate a unique ID
    ...item,
    created_at: new Date().toISOString()
  };
  inventory.unshift(newItem); // Add to beginning
  fs.writeFileSync(dbPath, JSON.stringify(inventory, null, 2));
  return newItem;
};
