import Edit from './L.PM.Edit';

Edit.CircleMarker = Edit.extend({
  initialize(layer) {
    this._layer = layer;
    this._enabled = false;
  },
  applyOptions() {
    if (this.options.draggable) {
      this.enableLayerDrag();
    } else {
      this.disableLayerDrag();
    }

    if (this.options.snappable) {
      this._initSnappableMarkers();
    } else {
      this._disableSnapping();
    }

    // enable removal for the marker
    if (!this.options.preventMarkerRemoval) {
      this._layer.on('contextmenu', this._removeMarker, this);
    }
  },
  toggleEdit(options) {
    if (!this.enabled()) {
      this.enable(options);
    } else {
      this.disable();
    }
  },
  enabled() {
    return this._enabled;
  },
  enable(options = { draggable: true, snappable: true }) {
    L.Util.setOptions(this, options);

    this._map = this._layer._map;

    // cancel when map isn't available, this happens when the polygon is removed before this fires
    if (!this._map) {
      return;
    }

    if (!this.enabled()) {
      // if it was already enabled, disable first
      // we don't block enabling again because new options might be passed
      this.disable();
    }

    // change state
    this._enabled = true;

    this.applyOptions();

    this._layer.on('pm:dragend', this._onMarkerDragEnd, this);
  },
  disable(layer = this._layer) {
    // if it's not enabled, it doesn't need to be disabled
    if (!this.enabled()) {
      return false;
    }

    // prevent disabling if layer is being dragged
    if (layer.pm._dragging) {
      return false;
    }
    layer.pm._enabled = false;

    // disable dragging
    this.disableLayerDrag();

    if (this._layerEdited) {
      this._layer.fire('pm:update', {});
    }
    this._layerEdited = false;

    return true;
  },
  _moveMarker(e) {
    const center = e.latlng;
    this._layer.setLatLng(center).redraw();
  },
  _removeMarker() {
    this._layer.fire('pm:remove');
    this._layer.remove();
  },
  _fireEdit() {
    // fire edit event
    this._layer.fire('pm:edit');
    this._layerEdited = true;
  },
  _onMarkerDragEnd(e) {
    this._layer.fire('pm:markerdragend', {
      markerEvent: e,
    });

    this._fireEdit();
  },
  // overwrite initSnappableMarkers from Snapping.js Mixin
  _initSnappableMarkers() {
    const marker = this._layer;

    this.options.snapDistance = this.options.snapDistance || 30;

    marker.off('pm:drag', this._handleSnapping, this);
    marker.on('pm:drag', this._handleSnapping, this);

    marker.off('pm:dragend', this._cleanupSnapping, this);
    marker.on('pm:dragend', this._cleanupSnapping, this);

    marker.off('pm:dragstart', this._unsnap, this);
    marker.on('pm:dragstart', this._unsnap, this);
  },
  _disableSnapping() {
    const marker = this._layer;

    marker.off('pm:drag', this._handleSnapping, this);
    marker.off('pm:dragend', this._cleanupSnapping, this);
    marker.off('pm:dragstart', this._unsnap, this);
  }
});
