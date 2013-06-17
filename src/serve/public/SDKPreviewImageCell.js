/** @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License v. 2.0 as published by Mozilla.

 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Mozilla Public License v. 2.0 for more details.

 * You should have received a copy of the Mozilla Public License v. 2.0
 * along with the Game Closure SDK.  If not, see <http://mozilla.org/MPL/2.0/>.
 */

"use import";

import lib.Enum as Enum;

import .SDKContextMenuCell as SDKContextMenuCell;

var loadingState = Enum(
	'LOADING_NONE',
	'LOADING_WAITING',
	'LOADING_READY'
);

var SDKPreviewImageCell = exports = Class(SDKContextMenuCell, function(supr) {
	this._checkImage = function(maxWidth, maxHeight) {
		var data = this._data;

		if (!this._loadingState) {
			this._loadingState = loadingState.LOADING_WAITING;

			var image = new Image();
			var ctx = this.preview.getContext('2d');

			image.onload = bind(
				this, 
				function() {
					this._loadingState = loadingState.LOADING_READY;

					this._data.width = image.width;
					this._data.height = image.height;

					var ow = image.width,
						oh = image.height,
						w = image.width,
						h = image.height;

					if (w > maxWidth) {
						h *= maxWidth / w;
						w = maxWidth;
					}

					if (h > maxHeight) {
						w *= maxHeight / h;
						h = maxHeight;
					}

					this._width = image.width;
					this._height = image.height;
					this.dimensions && this.dimensions.setLabel(this._width + 'x' + this._height);

					ctx.drawImage(image, 0, 0, ow, oh, (maxWidth - w) / 2, (maxHeight - h) / 2, w, h);
					image = null;
				}
			);

			image.src = data.url;
		}
	};
});
