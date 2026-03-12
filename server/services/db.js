/**
 * Simple file-based database using lowdb.
 * Each collection is a JSON file in server/data/.
 * Can be swapped for MongoDB by replacing these functions.
 */

const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadCollection(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function saveCollection(name, data) {
  const file = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Generic helpers
function findAll(collection) {
  const data = loadCollection(collection);
  return data[collection] || [];
}

function findById(collection, idField, id) {
  return findAll(collection).find(item => item[idField] === id) || null;
}

function insert(collection, idField, item) {
  const data = loadCollection(collection);
  if (!data[collection]) data[collection] = [];
  data[collection].push(item);
  saveCollection(collection, data);
  return item;
}

function update(collection, idField, id, updates) {
  const data = loadCollection(collection);
  if (!data[collection]) return null;
  const idx = data[collection].findIndex(item => item[idField] === id);
  if (idx === -1) return null;
  data[collection][idx] = { ...data[collection][idx], ...updates, updatedAt: new Date().toISOString() };
  saveCollection(collection, data);
  return data[collection][idx];
}

function remove(collection, idField, id) {
  const data = loadCollection(collection);
  if (!data[collection]) return false;
  const before = data[collection].length;
  data[collection] = data[collection].filter(item => item[idField] !== id);
  if (data[collection].length === before) return false;
  saveCollection(collection, data);
  return true;
}

module.exports = { findAll, findById, insert, update, remove };
