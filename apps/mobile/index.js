// Custom entry point. Kept as index.js (rather than pointing `main` straight at
// expo-router/entry) so future top-level native registrations — push background
// handlers, etc. — have a home that runs before the app mounts.
import 'expo-router/entry';
