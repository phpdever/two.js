(function(Two) {

  var _ = Two.Utils;

  var Texture = Two.Texture = function(src, callback) {

    this._renderer = {};
    this._renderer.type = 'texture';
    this._renderer.flagOffset = _.bind(Texture.FlagOffset, this);
    this._renderer.flagScale = _.bind(Texture.FlagScale, this);

    this.id = Two.Identifier + Two.uniqueId();
    this.classList = [];

    this.offset = new Two.Vector();

    if (_.isFunction(callback)) {
      var loaded = _.bind(function() {
        this.unbind(Two.Events.load, loaded);
        if (_.isFunction(callback)) {
          callback();
        }
      }, this);
      this.bind(Two.Events.load, loaded);
    }

    if (_.isString(src)) {
      this.src = src;
    } else if (_.isElement(src)) {
      this.image = src;
    }

    this._update();

  };

  _.extend(Texture, {

    Properties: [
      'src',
      'image',
      'loaded'
    ],

    ImageRegistry: new Two.Registry(),

    getImage: function(src) {

      if (Texture.ImageRegistry.contains(src)) {
        return Texture.ImageRegistry.get(src);
      }

      var image = document.createElement('img'); // TODO: What's the Node.js way?
      image.crossOrigin = 'anonymous';

      return image;

    },

    Register: {
      canvas: function(texture, callback) {
        texture._src = '#' + texture.id;
        Texture.ImageRegistry.add(texture.path, texture.image);
        if (_.isFunction(callback)) {
          callback();
        }
      },
      image: function(texture, callback) {
        var loaded = function(e) {
          Texture.ImageRegistry.add(texture.path, texture.image);
          texture.image.removeEventListener('load', loaded, false);
          texture.image.removeEventListener('error', error, false);
          if (_.isFunction(callback)) {
            callback();
          }
        };
        var error = function(e) {
          texture.image.removeEventListener('load', loaded, false);
          texture.image.removeEventListener('error', error, false);
          throw new Two.Utils.Error('unable to load ' + texture.src);
        };
        texture.image.addEventListener('load', loaded, false);
        texture.image.addEventListener('error', error, false);
        texture.image.src = texture.src;
      }
    },

    load: function(texture, callback) {

      var src = texture.src;
      var image = texture.image;

      if (texture._flagImage) {
        if (/canvas/i.test(image.nodeName)) {
          Texture.Register.canvas(texture, callback)
        } else {
          texture._src = image.src;
          Texture.Register.image(texture, callback);
        }
      }

      if (texture._flagSrc) {
        if (!image) {
          texture.image = Texture.getImage(texture.src);
        }
        Texture.Register.image(texture, callback);
      }

    },

    FlagOffset: function() {
      this._flagOffset = true;
    },

    FlagScale: function() {
      this._flagScale = true;
    },

    MakeObservable: function(object) {

      _.each(Texture.Properties, Two.Utils.defineProperty, object);

      Object.defineProperty(object, 'offset', {
        enumerable: true,
        get: function() {
          return this._offset;
        },
        set: function(v) {
          if (this._offset) {
            this._offset.unbind(Two.Events.change, this._renderer.flagOffset);
          }
          this._offset = v;
          this._offset.bind(Two.Events.change, this._renderer.flagOffset);
          this._flagOffset = true;
        }
      });

      Object.defineProperty(object, 'scale', {
        enumerable: true,
        get: function() {
          return this._scale;
        },
        set: function(v) {

          if (this._scale instanceof Two.Vector) {
            this._scale.unbind(Two.Events.change, this._renderer.flagScale);
          }

          this._scale = v;

          if (this._scale instanceof Two.Vector) {
            this._scale.bind(Two.Events.change, this._renderer.flagScale);
          }

          this._flagScale = true;

        }
      });

    }

  });

  _.extend(Texture.prototype, Two.Utils.Events, Two.Shape.prototype, {

    _flagSrc: false,
    _flagImage: false,
    _flagLoaded: false,

    _flagOffset: false,
    _flagScale: false,

    _src: '',
    _image: null,
    _loaded: false,

    _scale: 1,
    _offset: null,

    clone: function() {
      return new Texture(this.src);
    },

    toObject: function() {
      return {
        src: this.src,
        image: this.image
      }
    },

    _update: function() {

      if (this._flagSrc || this._flagImage) {
        this.trigger(Two.Events.change);
        this.loaded = false;
        Texture.load(this, _.bind(function() {
          this.loaded = true;
          this
            .trigger(Two.Events.change)
            .trigger(Two.Events.load);
        }, this));
      }

      return this;

    },

    flagReset: function() {

      this._flagSrc = this._flagImage = this._flagLoaded
        = this._flagScale = this._flagOffset = false;

      return this;

    }

  });

  Texture.MakeObservable(Texture.prototype);

})(this.Two);
