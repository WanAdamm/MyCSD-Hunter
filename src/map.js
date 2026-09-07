import { mount } from 'svelte';
import MapApp from './MapApp.svelte';
import './app.css';
import './map.css';

mount(MapApp, { target: document.getElementById('app') });
