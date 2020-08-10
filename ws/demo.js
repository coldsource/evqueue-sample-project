 /*
  * This file is part of evQueue
  *
  * evQueue is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * evQueue is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
  *
  * Author: Thibault Kummer
  */ 

import {CryptoJS} from './cryptojs/core.js';
import {evQueueCluster} from './evqueue-cluster.js';
 
// Configuration data
let node = 'ws://localhost:5001';
let user = 'admin';
let password = CryptoJS.SHA1('admin').toString(CryptoJS.enc.Hex);
 
// Store crendentials in local storage
window.localStorage.setItem('user',user);
window.localStorage.setItem('password',password);

// Instanciate API connection
let evqueue_api = new evQueueCluster([node]);

// Instanciate events connection and set events handler
let evqueue_events = new evQueueCluster([node], (data) => {
	// Reset initial state
	document.getElementById('status').style.backgroundColor = '#ffffff';
	document.getElementById('status').innerHTML = '';
	document.getElementById('launch').removeAttribute('disabled', false);
	
	// Unsubscribe events
	evqueue_events.UnsubscribeAll();
});

// Bind event on "Sleep" button
document.getElementById('launch').addEventListener('click', (ev) => {
	// Disable button to prevent multiple launches
	ev.target.setAttribute('disabled', true);
	
	// Change status indicator color
	document.getElementById('status').style.backgroundColor = '#49eb59';
	
	// Launch new instance
	evqueue_api.API({
		group: 'instance',
		action: 'launch',
		attributes: {name: 'sleep'}
	}).then( (data) => {
		let instance_id = data.documentElement.getAttribute('workflow-instance-id');
		evqueue_events.Subscribe('INSTANCE_TERMINATED', {group: 'instances', action: 'list'}, false, instance_id);
		document.getElementById('status').innerHTML = instance_id;
	});
});