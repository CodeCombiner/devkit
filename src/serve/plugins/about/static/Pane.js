/* @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with the Game Closure SDK.  If not, see <http://www.gnu.org/licenses/>.
 */

import ....sdkPlugin;
import shared.Version as Version;
import util.ajax;
import string.timeAgo;

import squill.TabbedPane;
import squill.Delegate;
import squill.models.DataSource;
import squill.Cell;

from util.browser import $;

var currentVersion = null;

var VersionCell = Class(squill.Cell, function(supr) {
	this._def = {
		className: 'version',
		children: [
			{id: 'switch', type: 'button', text: 'switch'},
			{id: 'label', type: 'label'}
		]
	};

	this.delegate = new squill.Delegate(function(on) {
		on.switch = function() {
			this.controller.publish('Switch', this._data);
		};
	});

	this.render = function() {
		this.label.setText(this._data.toString());

		if (this._data == currentVersion) {
			$.addClass(this._el, 'current');
		} else {
			$.removeClass(this._el, 'current');
		}
	};
});

var versionData = new squill.models.DataSource({key: 'src'});

exports = Class(sdkPlugin.SDKPlugin, function(supr) {
	this._def = {
		id: 'aboutPane',
		children: [
			{className: 'topTabs', type: squill.TabbedPane, panes: [
				{id: 'aboutMain', className: 'mainPanel', title: 'about', children: [
					{className: 'table', children: [
						{className: 'table-row', children: [
							{className: 'table-cell', children: [
								{id: 'bigLogo'},
								{id: 'version', text: ''},
								{id: 'lastChecked', children: [
									{id: 'updateStatus'},
									{id: 'lastCheckedStatus'},
									{id: 'refresh', type: 'button', text: '\u21BB', className: 'circle'}
								]}
							]}
						]},
					]},
				]},

				{
					className: 'support mainPanel',
					title: 'support',
					id: 'support'
				},

				{className: 'mainPanel', title: 'versions', children: [
					{id: 'versionHeader', children: [{tag: 'span', text: 'current version: '}, {tag: 'span', id: 'aboutVersion'}]},
					{id: 'versionWrapper', className: 'darkPanel', children: [
						{id: 'versions', type: 'list', dataSource: versionData, cellCtor: VersionCell, selectable: 'single'}
					]},
				]}
			]}
		]
	};

	this.delegate = new squill.Delegate(function(on) {

		on.refresh = function() {
			$.setText(this.lastCheckedStatus, 'checking for updates...');
			util.ajax.get({
				url: '/plugins/about/check_now/',
				type: 'json'
			}, bind(this, 'onVersions'));
		};
	});

	this.onSwitchVersion = function(version) {
		this.hideMore();
		$.setText(this.lastCheckedStatus, 'Updating... Please wait.');
		util.ajax.get({
				url: '/plugins/about/update/',
				data: {
					version: version.toString()
				}
			}, function(err, response) {
				if (err) {
					$.setText(err);
				} else {
					$.setText(this.lastCheckedStatus, 'Complete! Reload the page.');
				}
			});
	};

	this.buildWidget = function() {
		supr(this, 'buildWidget', arguments);

		this.getVersions();
		this.versions.subscribe('Switch', this, 'onSwitchVersion');

		this.support._el.innerHTML = '<ul class="support">\
			<li><a href="http://docs.gameclosure.com">Documentation</a></li>\
			<li><a href="https://gcsdk.zendesk.com/forums">Forum</a></li>\
			<li><a href="">Mailing List</a></li>\
			<li><a href="http://webchat.freenode.net/?channels=#gameclosure">IRC</a></li>\
			<li><a href="mailto:support@gameclosure.com">support@gameclosure.com</a></li>\
		</ul>';
	};

	this.getVersions = function() {
		util.ajax.get({
				url: '/plugins/about/version/', 
				type: 'json'
			}, bind(this, 'onVersions'));
	};

	this.onVersions = function(err, response) {
		if (!response) {
			return;
		}
		var lastChecked = response.info ? response.info.lastChecked : -1;
		if (lastChecked == -1) {
			$.setText(this.lastCheckedStatus, 'checking for updates...');
		} else {
			$.setText(this.lastCheckedStatus, 'last checked ' + string.timeAgo(lastChecked));
		}

		//determine the current version
		var version = new Version(response.info.version);

		versionData.clear();

		//loop through the available versions
		for (var name in response.tags) {
			var v = Version.parse(name);
			if (!v) continue;

			if (v.eq(version)) {
				currentVersion = v;
			}

			versionData.add(v);
		}

		versionData.sort(Version.sorterDesc);

		var verStr;
		if (!currentVersion) {
			verStr = 'Version unknown';
		} else {
			if (currentVersion.channel == 'release') {
				verStr = 'Version ' + currentVersion.toString(true); // don't show channel
			} else {
				verStr = 'Version ' + currentVersion.toString();
			}
		}

		$.setText(this.version, verStr);
		$.setText(this.aboutVersion, verStr);

		this._checkUpdates();
	};

	this._checkUpdates = function() {
		if (!currentVersion) {
			return;
		}

		var nextVersion = null;

		// find the first non-beta version greater than the current version
		versionData.forEach(function(v) {
			if (currentVersion.lt(v)) {
				nextVersion = v;
				return true;
			}
		}, this);

		if (nextVersion) {
			this._nextVersion = nextVersion;
			$.setText(this.updateStatus, 'an update is available!');
			logger.log(nextVersion.tag);
		} else {
			$.setText(this.updateStatus, 'no updates');
		}
	};
});