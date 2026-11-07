// node_modules/@vue/shared/dist/shared.esm-bundler.js
/**
* @vue/shared v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
	const map = /* @__PURE__ */ Object.create(null);
	for (const key of str.split(",")) map[key] = 1;
	return (val) => val in map;
}
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var NOOP = () => {};
var NO = () => false;
var isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
var isModelListener = (key) => key.startsWith("onUpdate:");
var extend = Object.assign;
var remove = (arr, el) => {
	const i = arr.indexOf(el);
	if (i > -1) arr.splice(i, 1);
};
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
var isArray = Array.isArray;
var isMap = (val) => toTypeString(val) === "[object Map]";
var isSet = (val) => toTypeString(val) === "[object Set]";
var isDate = (val) => toTypeString(val) === "[object Date]";
var isFunction = (val) => typeof val === "function";
var isString = (val) => typeof val === "string";
var isSymbol = (val) => typeof val === "symbol";
var isObject = (val) => val !== null && typeof val === "object";
var isPromise = (val) => {
	return (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
};
var objectToString = Object.prototype.toString;
var toTypeString = (value) => objectToString.call(value);
var toRawType = (value) => {
	return toTypeString(value).slice(8, -1);
};
var isPlainObject = (val) => toTypeString(val) === "[object Object]";
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
var cacheStringFunction = (fn) => {
	const cache = /* @__PURE__ */ Object.create(null);
	return ((str) => {
		return cache[str] || (cache[str] = fn(str));
	});
};
var camelizeRE = /-\w/g;
var camelize = /* @__PURE__ */ cacheStringFunction((str) => {
	return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
});
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = /* @__PURE__ */ cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
var capitalize = /* @__PURE__ */ cacheStringFunction((str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
});
var toHandlerKey = /* @__PURE__ */ cacheStringFunction((str) => {
	return str ? `on${capitalize(str)}` : ``;
});
var hasChanged = (value, oldValue) => !Object.is(value, oldValue);
var invokeArrayFns = (fns, ...arg) => {
	for (let i = 0; i < fns.length; i++) fns[i](...arg);
};
var def = (obj, key, value, writable = false) => {
	Object.defineProperty(obj, key, {
		configurable: true,
		enumerable: false,
		writable,
		value
	});
};
var looseToNumber = (val) => {
	const n = parseFloat(val);
	return isNaN(n) ? val : n;
};
var _globalThis;
var getGlobalThis = () => {
	return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
function normalizeStyle(value) {
	if (isArray(value)) {
		const res = {};
		for (let i = 0; i < value.length; i++) {
			const item = value[i];
			const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
			if (normalized) for (const key in normalized) res[key] = normalized[key];
		}
		return res;
	} else if (isString(value) || isObject(value)) return value;
}
var listDelimiterRE = /;(?![^(]*\))/g;
var propertyDelimiterRE = /:([^]+)/;
var styleCommentRE = /"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
	const ret = {};
	cssText.replace(styleCommentRE, (match) => match.startsWith("/*") ? "" : match).split(listDelimiterRE).forEach((item) => {
		if (item) {
			const tmp = item.split(propertyDelimiterRE);
			tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
		}
	});
	return ret;
}
function normalizeClass(value) {
	let res = "";
	if (isString(value)) res = value;
	else if (isArray(value)) for (let i = 0; i < value.length; i++) {
		const normalized = normalizeClass(value[i]);
		if (normalized) res += normalized + " ";
	}
	else if (isObject(value)) {
		for (const name in value) if (value[name]) res += name + " ";
	}
	return res.trim();
}
var isSpecialBooleanAttr = /* @__PURE__ */ makeMap(`itemscope,allowfullscreen,disablepictureinpicture,disableremoteplayback,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly`);
function includeBooleanAttr(value) {
	return !!value || value === "";
}
function looseCompareArrays(a, b, seen) {
	if (a.length !== b.length) return false;
	let equal = true;
	for (let i = 0; equal && i < a.length; i++) equal = looseEqual(a[i], b[i], seen);
	return equal;
}
function looseCompareCollections(a, b, seen) {
	if (a.size !== b.size) return false;
	const candidates = Array.from(b);
	const matched = new Uint8Array(candidates.length);
	for (const item of a) {
		let index = -1;
		for (let i = 0; i < candidates.length; i++) if (!matched[i] && looseEqual(item, candidates[i], seen)) {
			index = i;
			break;
		}
		if (index < 0) return false;
		matched[index] = 1;
	}
	return true;
}
function looseCompareObjects(a, b, seen) {
	let aValidType = isMap(a);
	let bValidType = isMap(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareCollections(a, b, seen) : false;
	aValidType = isSet(a);
	bValidType = isSet(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareCollections(a, b, seen) : false;
	if (Object.keys(a).length !== Object.keys(b).length) return false;
	for (const key in a) {
		const aHasKey = a.hasOwnProperty(key);
		const bHasKey = b.hasOwnProperty(key);
		if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key], seen)) return false;
	}
	return String(a) === String(b);
}
function looseCompareNested(a, b, seen, compare) {
	if (!seen) seen = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
	const [seenA, seenB] = seen;
	if (seenA.has(a) || seenB.has(b)) return seenA.get(a) === b && seenB.get(b) === a;
	seenA.set(a, b);
	seenB.set(b, a);
	const equal = compare(a, b, seen);
	seenA.delete(a);
	seenB.delete(b);
	return equal;
}
function looseEqual(a, b, seen) {
	if (a === b) return true;
	let aValidType = isDate(a);
	let bValidType = isDate(b);
	if (aValidType || bValidType) return aValidType && bValidType ? a.getTime() === b.getTime() : false;
	aValidType = isSymbol(a);
	bValidType = isSymbol(b);
	if (aValidType || bValidType) return a === b;
	aValidType = isArray(a);
	bValidType = isArray(b);
	if (aValidType || bValidType) return aValidType && bValidType ? looseCompareNested(a, b, seen, looseCompareArrays) : false;
	aValidType = isObject(a);
	bValidType = isObject(b);
	if (aValidType || bValidType) {
		if (!aValidType || !bValidType) return false;
		return looseCompareNested(a, b, seen, looseCompareObjects);
	}
	return String(a) === String(b);
}
function looseIndexOf(arr, val) {
	return arr.findIndex((item) => looseEqual(item, val));
}
var isRef$1 = (val) => {
	return !!(val && val["__v_isRef"] === true);
};
var toDisplayString = (val) => {
	return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
var replacer = (_key, val) => {
	if (isRef$1(val)) return replacer(_key, val.value);
	else if (isMap(val)) return { [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2], i) => {
		entries[stringifySymbol(key, i) + " =>"] = val2;
		return entries;
	}, {}) };
	else if (isSet(val)) return { [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v)) };
	else if (isSymbol(val)) return stringifySymbol(val);
	else if (isObject(val) && !isArray(val) && !isPlainObject(val)) return String(val);
	return val;
};
var stringifySymbol = (v, i = "") => {
	var _a;
	return isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v;
};
// node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
/**
* @vue/reactivity v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var activeEffectScope;
var EffectScope = class {
	constructor(detached = false) {
		this.detached = detached;
		/**
		* @internal
		*/
		this._active = true;
		/**
		* @internal track `on` calls, allow `on` call multiple times
		*/
		this._on = 0;
		/**
		* @internal
		*/
		this.effects = [];
		/**
		* @internal
		*/
		this.cleanups = [];
		this._isPaused = false;
		this._warnOnRun = true;
		this.__v_skip = true;
		if (!detached && activeEffectScope) {
			if (activeEffectScope.active) {
				this.parent = activeEffectScope;
				this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
			} else {
				this._active = false;
				this._warnOnRun = false;
			}
		}
	}
	get active() {
		return this._active;
	}
	pause() {
		if (this._active) {
			this._isPaused = true;
			let i, l;
			if (this.scopes) {
				const scopes = this.scopes.slice();
				for (i = 0, l = scopes.length; i < l; i++) scopes[i].pause();
			}
			for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].pause();
		}
	}
	/**
	* Resumes the effect scope, including all child scopes and effects.
	*/
	resume() {
		if (this._active) {
			if (this._isPaused) {
				this._isPaused = false;
				let i, l;
				if (this.scopes) {
					const scopes = this.scopes.slice();
					for (i = 0, l = scopes.length; i < l; i++) scopes[i].resume();
				}
				const effects = this.effects.slice();
				for (i = 0, l = effects.length; i < l; i++) effects[i].resume();
			}
		}
	}
	run(fn) {
		if (this._active) {
			const currentEffectScope = activeEffectScope;
			try {
				activeEffectScope = this;
				return fn();
			} finally {
				activeEffectScope = currentEffectScope;
			}
		}
	}
	/**
	* This should only be called on non-detached scopes
	* @internal
	*/
	on() {
		if (++this._on === 1) {
			this.prevScope = activeEffectScope;
			activeEffectScope = this;
		}
	}
	/**
	* This should only be called on non-detached scopes
	* @internal
	*/
	off() {
		if (this._on > 0 && --this._on === 0) {
			if (activeEffectScope === this) activeEffectScope = this.prevScope;
			else {
				let current = activeEffectScope;
				while (current) {
					if (current.prevScope === this) {
						current.prevScope = this.prevScope;
						break;
					}
					current = current.prevScope;
				}
			}
			this.prevScope = void 0;
		}
	}
	stop(fromParent) {
		if (this._active) {
			this._active = false;
			let i, l;
			for (i = 0, l = this.effects.length; i < l; i++) this.effects[i].stop();
			this.effects.length = 0;
			for (i = 0, l = this.cleanups.length; i < l; i++) this.cleanups[i]();
			this.cleanups.length = 0;
			if (this.scopes) {
				const scopes = this.scopes.slice();
				for (i = 0, l = scopes.length; i < l; i++) scopes[i].stop(true);
				this.scopes.length = 0;
			}
			if (!this.detached && this.parent && !fromParent) {
				const last = this.parent.scopes.pop();
				if (last && last !== this) {
					this.parent.scopes[this.index] = last;
					last.index = this.index;
				}
			}
			this.parent = void 0;
		}
	}
};
function getCurrentScope() {
	return activeEffectScope;
}
var activeSub;
var pausedQueueEffects = /* @__PURE__ */ new WeakSet();
var ReactiveEffect = class {
	constructor(fn) {
		this.fn = fn;
		/**
		* @internal
		*/
		this.deps = void 0;
		/**
		* @internal
		*/
		this.depsTail = void 0;
		/**
		* @internal
		*/
		this.flags = 5;
		/**
		* @internal
		*/
		this.next = void 0;
		/**
		* @internal
		*/
		this.cleanup = void 0;
		this.scheduler = void 0;
		if (activeEffectScope) {
			if (activeEffectScope.active) activeEffectScope.effects.push(this);
			else this.flags &= -2;
		}
	}
	pause() {
		this.flags |= 64;
	}
	resume() {
		if (this.flags & 64) {
			this.flags &= -65;
			if (pausedQueueEffects.has(this)) {
				pausedQueueEffects.delete(this);
				this.trigger();
			}
		}
	}
	/**
	* @internal
	*/
	notify() {
		if (this.flags & 2 && !(this.flags & 32)) return;
		if (!(this.flags & 8)) batch(this);
	}
	run() {
		if (!(this.flags & 1)) return this.fn();
		this.flags |= 2;
		cleanupEffect(this);
		prepareDeps(this);
		const prevEffect = activeSub;
		const prevShouldTrack = shouldTrack;
		activeSub = this;
		shouldTrack = true;
		try {
			return this.fn();
		} finally {
			cleanupDeps(this);
			activeSub = prevEffect;
			shouldTrack = prevShouldTrack;
			this.flags &= -3;
		}
	}
	stop() {
		if (this.flags & 1) {
			for (let link = this.deps; link; link = link.nextDep) removeSub(link);
			this.deps = this.depsTail = void 0;
			cleanupEffect(this);
			this.onStop && this.onStop();
			this.flags &= -2;
		}
	}
	trigger() {
		if (this.flags & 64) pausedQueueEffects.add(this);
		else if (this.scheduler) this.scheduler();
		else this.runIfDirty();
	}
	/**
	* @internal
	*/
	runIfDirty() {
		if (isDirty(this)) this.run();
	}
	get dirty() {
		return isDirty(this);
	}
};
var batchDepth = 0;
var batchedSub;
var batchedComputed;
function batch(sub, isComputed = false) {
	sub.flags |= 8;
	if (isComputed) {
		sub.next = batchedComputed;
		batchedComputed = sub;
		return;
	}
	sub.next = batchedSub;
	batchedSub = sub;
}
function startBatch() {
	batchDepth++;
}
function endBatch() {
	if (--batchDepth > 0) return;
	if (batchedComputed) {
		let e = batchedComputed;
		batchedComputed = void 0;
		while (e) {
			const next = e.next;
			e.next = void 0;
			e.flags &= -9;
			e = next;
		}
	}
	let error;
	while (batchedSub) {
		let e = batchedSub;
		batchedSub = void 0;
		while (e) {
			const next = e.next;
			e.next = void 0;
			e.flags &= -9;
			if (e.flags & 1) try {
				e.trigger();
			} catch (err) {
				if (!error) error = err;
			}
			e = next;
		}
	}
	if (error) throw error;
}
function prepareDeps(sub) {
	for (let link = sub.deps; link; link = link.nextDep) {
		link.version = -1;
		link.prevActiveLink = link.dep.activeLink;
		link.dep.activeLink = link;
	}
}
function cleanupDeps(sub) {
	let head;
	let tail = sub.depsTail;
	let link = tail;
	while (link) {
		const prev = link.prevDep;
		if (link.version === -1) {
			if (link === tail) tail = prev;
			removeSub(link);
			removeDep(link);
		} else head = link;
		link.dep.activeLink = link.prevActiveLink;
		link.prevActiveLink = void 0;
		link = prev;
	}
	sub.deps = head;
	sub.depsTail = tail;
}
function isDirty(sub) {
	for (let link = sub.deps; link; link = link.nextDep) if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) return true;
	if (sub._dirty) return true;
	return false;
}
function refreshComputed(computed) {
	if (computed.flags & 4 && !(computed.flags & 16)) return;
	computed.flags &= -17;
	if (computed.globalVersion === globalVersion) return;
	computed.globalVersion = globalVersion;
	if (!computed.isSSR && computed.flags & 128 && (!computed.deps && !computed._dirty || !isDirty(computed))) return;
	computed.flags |= 2;
	const dep = computed.dep;
	const prevSub = activeSub;
	const prevShouldTrack = shouldTrack;
	activeSub = computed;
	shouldTrack = true;
	try {
		prepareDeps(computed);
		const value = computed.fn(computed._value);
		if (dep.version === 0 || hasChanged(value, computed._value)) {
			computed.flags |= 128;
			computed._value = value;
			dep.version++;
		}
	} catch (err) {
		dep.version++;
		throw err;
	} finally {
		activeSub = prevSub;
		shouldTrack = prevShouldTrack;
		cleanupDeps(computed);
		computed.flags &= -3;
	}
}
function removeSub(link, soft = false) {
	const { dep, prevSub, nextSub } = link;
	if (prevSub) {
		prevSub.nextSub = nextSub;
		link.prevSub = void 0;
	}
	if (nextSub) {
		nextSub.prevSub = prevSub;
		link.nextSub = void 0;
	}
	if (dep.subs === link) {
		dep.subs = prevSub;
		if (!prevSub && dep.computed) {
			dep.computed.flags &= -5;
			for (let l = dep.computed.deps; l; l = l.nextDep) removeSub(l, true);
		}
	}
	if (!soft && !--dep.sc && dep.map) dep.map.delete(dep.key);
}
function removeDep(link) {
	const { prevDep, nextDep } = link;
	if (prevDep) {
		prevDep.nextDep = nextDep;
		link.prevDep = void 0;
	}
	if (nextDep) {
		nextDep.prevDep = prevDep;
		link.nextDep = void 0;
	}
}
var shouldTrack = true;
var trackStack = [];
function pauseTracking() {
	trackStack.push(shouldTrack);
	shouldTrack = false;
}
function resetTracking() {
	const last = trackStack.pop();
	shouldTrack = last === void 0 ? true : last;
}
function cleanupEffect(e) {
	const { cleanup } = e;
	e.cleanup = void 0;
	if (cleanup) {
		const prevSub = activeSub;
		activeSub = void 0;
		try {
			cleanup();
		} finally {
			activeSub = prevSub;
		}
	}
}
var globalVersion = 0;
var Link = class {
	constructor(sub, dep) {
		this.sub = sub;
		this.dep = dep;
		this.version = dep.version;
		this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
	}
};
var Dep = class {
	constructor(computed) {
		this.computed = computed;
		this.version = 0;
		/**
		* Link between this dep and the current active effect
		*/
		this.activeLink = void 0;
		/**
		* Doubly linked list representing the subscribing effects (tail)
		*/
		this.subs = void 0;
		/**
		* For object property deps cleanup
		*/
		this.map = void 0;
		this.key = void 0;
		/**
		* Subscriber counter
		*/
		this.sc = 0;
		/**
		* @internal
		*/
		this.__v_skip = true;
	}
	track(debugInfo) {
		if (!activeSub || !shouldTrack || activeSub === this.computed) return;
		let link = this.activeLink;
		if (link === void 0 || link.sub !== activeSub) {
			link = this.activeLink = new Link(activeSub, this);
			if (!activeSub.deps) activeSub.deps = activeSub.depsTail = link;
			else {
				link.prevDep = activeSub.depsTail;
				activeSub.depsTail.nextDep = link;
				activeSub.depsTail = link;
			}
			addSub(link);
		} else if (link.version === -1) {
			link.version = this.version;
			if (link.nextDep) {
				const next = link.nextDep;
				next.prevDep = link.prevDep;
				if (link.prevDep) link.prevDep.nextDep = next;
				link.prevDep = activeSub.depsTail;
				link.nextDep = void 0;
				activeSub.depsTail.nextDep = link;
				activeSub.depsTail = link;
				if (activeSub.deps === link) activeSub.deps = next;
			}
		}
		return link;
	}
	trigger(debugInfo) {
		this.version++;
		globalVersion++;
		this.notify(debugInfo);
	}
	notify(debugInfo) {
		startBatch();
		try {
			for (let link = this.subs; link; link = link.prevSub) if (link.sub.notify()) link.sub.dep.notify();
		} finally {
			endBatch();
		}
	}
};
function addSub(link) {
	link.dep.sc++;
	if (link.sub.flags & 4) {
		const computed = link.dep.computed;
		if (computed && !link.dep.subs) {
			computed.flags |= 20;
			for (let l = computed.deps; l; l = l.nextDep) addSub(l);
		}
		const currentTail = link.dep.subs;
		if (currentTail !== link) {
			link.prevSub = currentTail;
			if (currentTail) currentTail.nextSub = link;
		}
		link.dep.subs = link;
	}
}
var targetMap = /* @__PURE__ */ new WeakMap();
var ITERATE_KEY = /* @__PURE__ */ Symbol("");
var MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol("");
var ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol("");
function track(target, type, key) {
	if (shouldTrack && activeSub) {
		let depsMap = targetMap.get(target);
		if (!depsMap) targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
		let dep = depsMap.get(key);
		if (!dep) {
			depsMap.set(key, dep = new Dep());
			dep.map = depsMap;
			dep.key = key;
		}
		dep.track();
	}
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
	const depsMap = targetMap.get(target);
	if (!depsMap) {
		globalVersion++;
		return;
	}
	const run = (dep) => {
		if (dep) dep.trigger();
	};
	startBatch();
	if (type === "clear") depsMap.forEach(run);
	else {
		const targetIsArray = isArray(target);
		const isArrayIndex = targetIsArray && isIntegerKey(key);
		if (targetIsArray && key === "length") {
			const newLength = Number(newValue);
			depsMap.forEach((dep, key2) => {
				if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) run(dep);
			});
		} else {
			if (key !== void 0 || depsMap.has(void 0)) run(depsMap.get(key));
			if (isArrayIndex) run(depsMap.get(ARRAY_ITERATE_KEY));
			switch (type) {
				case "add":
					if (!targetIsArray) {
						run(depsMap.get(ITERATE_KEY));
						if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
					} else if (isArrayIndex) run(depsMap.get("length"));
					break;
				case "delete":
					if (!targetIsArray) {
						run(depsMap.get(ITERATE_KEY));
						if (isMap(target)) run(depsMap.get(MAP_KEY_ITERATE_KEY));
					}
					break;
				case "set": if (isMap(target)) run(depsMap.get(ITERATE_KEY));
			}
		}
	}
	endBatch();
}
function reactiveReadArray(array) {
	const raw = /* @__PURE__ */ toRaw(array);
	if (raw === array) return raw;
	track(raw, "iterate", ARRAY_ITERATE_KEY);
	if (/* @__PURE__ */ isShallow(array)) return raw;
	if (!/* @__PURE__ */ isReadonly(array)) return raw.map(toReactive);
	return /* @__PURE__ */ isReactive(array) ? raw.map((item) => toReadonly(toReactive(item))) : raw.map(toReadonly);
}
function shallowReadArray(arr) {
	track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
	return arr;
}
function toWrapped(target, item) {
	if (/* @__PURE__ */ isReadonly(target)) return /* @__PURE__ */ isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
	return toReactive(item);
}
var arrayInstrumentations = {
	__proto__: null,
	[Symbol.iterator]() {
		return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
	},
	concat(...args) {
		return reactiveReadArray(this).concat(...args.map((x) => isArray(x) ? reactiveReadArray(x) : x));
	},
	entries() {
		return iterator(this, "entries", (value) => {
			value[1] = toWrapped(this, value[1]);
			return value;
		});
	},
	every(fn, thisArg) {
		return apply(this, "every", fn, thisArg, void 0, arguments);
	},
	filter(fn, thisArg) {
		return apply(this, "filter", fn, thisArg, (v) => v.map((item) => toWrapped(this, item)), arguments);
	},
	find(fn, thisArg) {
		return apply(this, "find", fn, thisArg, (item) => toWrapped(this, item), arguments);
	},
	findIndex(fn, thisArg) {
		return apply(this, "findIndex", fn, thisArg, void 0, arguments);
	},
	findLast(fn, thisArg) {
		return apply(this, "findLast", fn, thisArg, (item) => toWrapped(this, item), arguments);
	},
	findLastIndex(fn, thisArg) {
		return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
	},
	forEach(fn, thisArg) {
		return apply(this, "forEach", fn, thisArg, void 0, arguments);
	},
	includes(...args) {
		return searchProxy(this, "includes", args);
	},
	indexOf(...args) {
		return searchProxy(this, "indexOf", args);
	},
	join(separator) {
		return reactiveReadArray(this).join(separator);
	},
	lastIndexOf(...args) {
		return searchProxy(this, "lastIndexOf", args);
	},
	map(fn, thisArg) {
		return apply(this, "map", fn, thisArg, void 0, arguments);
	},
	pop() {
		return noTracking(this, "pop");
	},
	push(...args) {
		return noTracking(this, "push", args);
	},
	reduce(fn, ...args) {
		return reduce(this, "reduce", fn, args);
	},
	reduceRight(fn, ...args) {
		return reduce(this, "reduceRight", fn, args);
	},
	shift() {
		return noTracking(this, "shift");
	},
	some(fn, thisArg) {
		return apply(this, "some", fn, thisArg, void 0, arguments);
	},
	splice(...args) {
		return noTracking(this, "splice", args);
	},
	toReversed() {
		return reactiveReadArray(this).toReversed();
	},
	toSorted(comparer) {
		return reactiveReadArray(this).toSorted(comparer);
	},
	toSpliced(...args) {
		return reactiveReadArray(this).toSpliced(...args);
	},
	unshift(...args) {
		return noTracking(this, "unshift", args);
	},
	values() {
		return iterator(this, "values", (item) => toWrapped(this, item));
	}
};
function iterator(self, method, wrapValue) {
	const arr = shallowReadArray(self);
	const methodFn = arr[method];
	const iter = methodFn.call(arr);
	if (arr !== self && !/* @__PURE__ */ isShallow(self)) {
		if (iter[Symbol.toStringTag] === "Array Iterator") {
			const wrapped = Object.create(Object.getPrototypeOf(iter));
			wrapped.next = () => wrapResult(iter.next(), wrapValue);
			if (methodFn !== arrayProto[method]) Object.defineProperties(wrapped, {
				return: { get() {
					const fn = iter.return;
					return typeof fn === "function" ? fn.bind(iter) : fn;
				} },
				throw: { get() {
					const fn = iter.throw;
					return typeof fn === "function" ? fn.bind(iter) : fn;
				} }
			});
			return wrapped;
		}
		iter._next = iter.next;
		iter.next = () => wrapResult(iter._next(), wrapValue);
	}
	return iter;
}
function wrapResult(result, wrapValue) {
	if (!result.done) result.value = wrapValue(result.value);
	return result;
}
var arrayProto = Array.prototype;
function apply(self, method, fn, thisArg, wrappedRetFn, args) {
	const arr = shallowReadArray(self);
	const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
	const methodFn = arr[method];
	if (methodFn !== arrayProto[method]) {
		const result2 = methodFn.apply(self, args);
		return needsWrap ? toReactive(result2) : result2;
	}
	let wrappedFn = fn;
	if (arr !== self) {
		if (needsWrap) wrappedFn = function(item, index) {
			return fn.call(this, toWrapped(self, item), index, self);
		};
		else if (fn.length > 2) wrappedFn = function(item, index) {
			return fn.call(this, item, index, self);
		};
	}
	const result = methodFn.call(arr, wrappedFn, thisArg);
	return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self, method, fn, args) {
	const arr = shallowReadArray(self);
	const needsWrap = arr !== self && !/* @__PURE__ */ isShallow(self);
	let wrappedFn = fn;
	let wrapInitialAccumulator = false;
	if (arr !== self) {
		if (needsWrap) {
			wrapInitialAccumulator = args.length === 0;
			wrappedFn = function(acc, item, index) {
				if (wrapInitialAccumulator) {
					wrapInitialAccumulator = false;
					acc = toWrapped(self, acc);
				}
				return fn.call(this, acc, toWrapped(self, item), index, self);
			};
		} else if (fn.length > 3) wrappedFn = function(acc, item, index) {
			return fn.call(this, acc, item, index, self);
		};
	}
	const result = arr[method](wrappedFn, ...args);
	return wrapInitialAccumulator ? toWrapped(self, result) : result;
}
function searchProxy(self, method, args) {
	const arr = /* @__PURE__ */ toRaw(self);
	track(arr, "iterate", ARRAY_ITERATE_KEY);
	const res = arr[method](...args);
	if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
		args[0] = /* @__PURE__ */ toRaw(args[0]);
		return arr[method](...args);
	}
	return res;
}
function noTracking(self, method, args = []) {
	pauseTracking();
	startBatch();
	const res = (/* @__PURE__ */ toRaw(self))[method].apply(self, args);
	endBatch();
	resetTracking();
	return res;
}
var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
var builtInSymbols = /* @__PURE__ */ new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol));
function hasOwnProperty(key) {
	if (!isSymbol(key)) key = String(key);
	const obj = /* @__PURE__ */ toRaw(this);
	track(obj, "has", key);
	return obj.hasOwnProperty(key);
}
var BaseReactiveHandler = class {
	constructor(_isReadonly = false, _isShallow = false) {
		this._isReadonly = _isReadonly;
		this._isShallow = _isShallow;
	}
	get(target, key, receiver) {
		if (key === "__v_skip") return target["__v_skip"];
		const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
		if (key === "__v_isReactive") return !isReadonly2;
		else if (key === "__v_isReadonly") return isReadonly2;
		else if (key === "__v_isShallow") return isShallow2;
		else if (key === "__v_raw") {
			if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) return target;
			return;
		}
		const targetIsArray = isArray(target);
		if (!isReadonly2) {
			let fn;
			if (targetIsArray && (fn = arrayInstrumentations[key])) return fn;
			if (key === "hasOwnProperty") return hasOwnProperty;
		}
		const res = Reflect.get(target, key, /* @__PURE__ */ isRef(target) ? target : receiver);
		if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) return res;
		if (!isReadonly2) track(target, "get", key);
		if (isShallow2) return res;
		if (/* @__PURE__ */ isRef(res)) {
			const value = targetIsArray && isIntegerKey(key) ? res : res.value;
			return isReadonly2 && isObject(value) ? /* @__PURE__ */ readonly(value) : value;
		}
		if (isObject(res)) return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
		return res;
	}
};
var MutableReactiveHandler = class extends BaseReactiveHandler {
	constructor(isShallow2 = false) {
		super(false, isShallow2);
	}
	set(target, key, value, receiver) {
		let oldValue = target[key];
		const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
		if (!this._isShallow) {
			const isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
			if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
				oldValue = /* @__PURE__ */ toRaw(oldValue);
				value = /* @__PURE__ */ toRaw(value);
			}
			if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
				if (isOldValueReadonly) return true;
				else {
					oldValue.value = value;
					return true;
				}
			}
		}
		const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
		const result = Reflect.set(target, key, value, /* @__PURE__ */ isRef(target) ? target : receiver);
		if (target === /* @__PURE__ */ toRaw(receiver) && result) {
			if (!hadKey) trigger(target, "add", key, value);
			else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
		}
		return result;
	}
	deleteProperty(target, key) {
		const hadKey = hasOwn(target, key);
		const oldValue = target[key];
		const result = Reflect.deleteProperty(target, key);
		if (result && hadKey) trigger(target, "delete", key, void 0, oldValue);
		return result;
	}
	has(target, key) {
		const result = Reflect.has(target, key);
		if (!isSymbol(key) || !builtInSymbols.has(key)) track(target, "has", key);
		return result;
	}
	ownKeys(target) {
		track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
		return Reflect.ownKeys(target);
	}
};
var ReadonlyReactiveHandler = class extends BaseReactiveHandler {
	constructor(isShallow2 = false) {
		super(true, isShallow2);
	}
	set(target, key) {
		return true;
	}
	deleteProperty(target, key) {
		return true;
	}
};
var mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
var readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
var shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
var toShallow = (value) => value;
var getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
	return function(...args) {
		const target = this["__v_raw"];
		const rawTarget = /* @__PURE__ */ toRaw(target);
		const targetIsMap = isMap(rawTarget);
		const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
		const isKeyOnly = method === "keys" && targetIsMap;
		const innerIterator = target[method](...args);
		const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
		!isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
		return extend(Object.create(innerIterator), { next() {
			const { value, done } = innerIterator.next();
			return done ? {
				value,
				done
			} : {
				value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
				done
			};
		} });
	};
}
function createReadonlyMethod(type) {
	return function(...args) {
		return type === "delete" ? false : type === "clear" ? void 0 : this;
	};
}
function createInstrumentations(readonly, shallow) {
	const instrumentations = {
		get(key) {
			const target = this["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const rawKey = /* @__PURE__ */ toRaw(key);
			if (!readonly) {
				if (hasChanged(key, rawKey)) track(rawTarget, "get", key);
				track(rawTarget, "get", rawKey);
			}
			const { has } = getProto(rawTarget);
			const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
			if (has.call(rawTarget, key)) return wrap(target.get(key));
			else if (has.call(rawTarget, rawKey)) return wrap(target.get(rawKey));
			else if (target !== rawTarget) target.get(key);
		},
		get size() {
			const target = this["__v_raw"];
			!readonly && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY);
			return target.size;
		},
		has(key) {
			const target = this["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const rawKey = /* @__PURE__ */ toRaw(key);
			if (!readonly) {
				if (hasChanged(key, rawKey)) track(rawTarget, "has", key);
				track(rawTarget, "has", rawKey);
			}
			return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
		},
		forEach(callback, thisArg) {
			const observed = this;
			const target = observed["__v_raw"];
			const rawTarget = /* @__PURE__ */ toRaw(target);
			const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
			!readonly && track(rawTarget, "iterate", ITERATE_KEY);
			return target.forEach((value, key) => {
				return callback.call(thisArg, wrap(value), wrap(key), observed);
			});
		}
	};
	extend(instrumentations, readonly ? {
		add: createReadonlyMethod("add"),
		set: createReadonlyMethod("set"),
		delete: createReadonlyMethod("delete"),
		clear: createReadonlyMethod("clear")
	} : {
		add(value) {
			const target = /* @__PURE__ */ toRaw(this);
			const proto = getProto(target);
			const rawValue = /* @__PURE__ */ toRaw(value);
			const valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) ? rawValue : value;
			if (!(proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue))) {
				target.add(valueToAdd);
				trigger(target, "add", valueToAdd, valueToAdd);
			}
			return this;
		},
		set(key, value) {
			if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) value = /* @__PURE__ */ toRaw(value);
			const target = /* @__PURE__ */ toRaw(this);
			const { has, get } = getProto(target);
			let hadKey = has.call(target, key);
			if (!hadKey) {
				key = /* @__PURE__ */ toRaw(key);
				hadKey = has.call(target, key);
			}
			const oldValue = get.call(target, key);
			target.set(key, value);
			if (!hadKey) trigger(target, "add", key, value);
			else if (hasChanged(value, oldValue)) trigger(target, "set", key, value, oldValue);
			return this;
		},
		delete(key) {
			const target = /* @__PURE__ */ toRaw(this);
			const { has, get } = getProto(target);
			let hadKey = has.call(target, key);
			if (!hadKey) {
				key = /* @__PURE__ */ toRaw(key);
				hadKey = has.call(target, key);
			}
			const oldValue = get ? get.call(target, key) : void 0;
			const result = target.delete(key);
			if (hadKey) trigger(target, "delete", key, void 0, oldValue);
			return result;
		},
		clear() {
			const target = /* @__PURE__ */ toRaw(this);
			const hadItems = target.size !== 0;
			const oldTarget = void 0;
			const result = target.clear();
			if (hadItems) trigger(target, "clear", void 0, void 0, oldTarget);
			return result;
		}
	});
	[
		"keys",
		"values",
		"entries",
		Symbol.iterator
	].forEach((method) => {
		instrumentations[method] = createIterableMethod(method, readonly, shallow);
	});
	return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
	const instrumentations = createInstrumentations(isReadonly2, shallow);
	return (target, key, receiver) => {
		if (key === "__v_isReactive") return !isReadonly2;
		else if (key === "__v_isReadonly") return isReadonly2;
		else if (key === "__v_isShallow") return shallow;
		else if (key === "__v_raw") return target;
		return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
	};
}
var mutableCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(false, false) };
var shallowCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(false, true) };
var readonlyCollectionHandlers = { get: /* @__PURE__ */ createInstrumentationGetter(true, false) };
var reactiveMap = /* @__PURE__ */ new WeakMap();
var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
var readonlyMap = /* @__PURE__ */ new WeakMap();
var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
	switch (rawType) {
		case "Object":
		case "Array": return 1;
		case "Map":
		case "Set":
		case "WeakMap":
		case "WeakSet": return 2;
		default: return 0;
	}
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
	if (/* @__PURE__ */ isReadonly(target)) return target;
	return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
	return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
	return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
	if (!isObject(target)) return target;
	if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) return target;
	if (target["__v_skip"] || !Object.isExtensible(target)) return target;
	const existingProxy = proxyMap.get(target);
	if (existingProxy) return existingProxy;
	const targetType = targetTypeMap(toRawType(target));
	if (targetType === 0) return target;
	const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
	proxyMap.set(target, proxy);
	return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
	if (/* @__PURE__ */ isReadonly(value)) return /* @__PURE__ */ isReactive(value["__v_raw"]);
	return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
	return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
	return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
	return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
	const raw = observed && observed["__v_raw"];
	return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
function markRaw(value) {
	if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) def(value, "__v_skip", true);
	return value;
}
var toReactive = (value) => isObject(value) ? /* @__PURE__ */ reactive(value) : value;
var toReadonly = (value) => isObject(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
	return r ? r["__v_isRef"] === true : false;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
	return createRef(value, false);
}
function createRef(rawValue, shallow) {
	if (/* @__PURE__ */ isRef(rawValue)) return rawValue;
	return new RefImpl(rawValue, shallow);
}
var RefImpl = class {
	constructor(value, isShallow2) {
		this.dep = new Dep();
		this["__v_isRef"] = true;
		this["__v_isShallow"] = false;
		this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw(value);
		this._value = isShallow2 ? value : toReactive(value);
		this["__v_isShallow"] = isShallow2;
	}
	get value() {
		this.dep.track();
		return this._value;
	}
	set value(newValue) {
		const oldValue = this._rawValue;
		const useDirectValue = this["__v_isShallow"] || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly(newValue);
		newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw(newValue);
		if (hasChanged(newValue, oldValue)) {
			this._rawValue = newValue;
			this._value = useDirectValue ? newValue : toReactive(newValue);
			this.dep.trigger();
		}
	}
};
function unref(ref2) {
	return /* @__PURE__ */ isRef(ref2) ? ref2.value : ref2;
}
var shallowUnwrapHandlers = {
	get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
	set: (target, key, value, receiver) => {
		const oldValue = target[key];
		if (/* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
			oldValue.value = value;
			return true;
		} else return Reflect.set(target, key, value, receiver);
	}
};
function proxyRefs(objectWithRefs) {
	return /* @__PURE__ */ isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
var ComputedRefImpl = class {
	constructor(fn, setter, isSSR) {
		this.fn = fn;
		this.setter = setter;
		/**
		* @internal
		*/
		this._value = void 0;
		/**
		* @internal
		*/
		this.dep = new Dep(this);
		/**
		* @internal
		*/
		this.__v_isRef = true;
		/**
		* @internal
		*/
		this.deps = void 0;
		/**
		* @internal
		*/
		this.depsTail = void 0;
		/**
		* @internal
		*/
		this.flags = 16;
		/**
		* @internal
		*/
		this.globalVersion = globalVersion - 1;
		/**
		* @internal
		*/
		this.next = void 0;
		this.effect = this;
		this["__v_isReadonly"] = !setter;
		this.isSSR = isSSR;
	}
	/**
	* @internal
	*/
	notify() {
		this.flags |= 16;
		if (!(this.flags & 8) && activeSub !== this) {
			batch(this, true);
			return true;
		}
	}
	get value() {
		const link = this.dep.track();
		refreshComputed(this);
		if (link) link.version = this.dep.version;
		return this._value;
	}
	set value(newValue) {
		if (this.setter) this.setter(newValue);
	}
};
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
	let getter;
	let setter;
	if (isFunction(getterOrOptions)) getter = getterOrOptions;
	else {
		getter = getterOrOptions.get;
		setter = getterOrOptions.set;
	}
	return new ComputedRefImpl(getter, setter, isSSR);
}
var INITIAL_WATCHER_VALUE = {};
var cleanupMap = /* @__PURE__ */ new WeakMap();
var activeWatcher = void 0;
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
	if (owner) {
		let cleanups = cleanupMap.get(owner);
		if (!cleanups) cleanupMap.set(owner, cleanups = []);
		cleanups.push(cleanupFn);
	}
}
function watch$1(source, cb, options = EMPTY_OBJ) {
	const { immediate, deep, once, scheduler, augmentJob, call } = options;
	const reactiveGetter = (source2) => {
		if (deep) return source2;
		if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0) return traverse(source2, 1);
		return traverse(source2);
	};
	let effect;
	let getter;
	let cleanup;
	let boundCleanup;
	let forceTrigger = false;
	let isMultiSource = false;
	if (/* @__PURE__ */ isRef(source)) {
		getter = () => source.value;
		forceTrigger = /* @__PURE__ */ isShallow(source);
	} else if (/* @__PURE__ */ isReactive(source)) {
		getter = () => reactiveGetter(source);
		forceTrigger = true;
	} else if (isArray(source)) {
		isMultiSource = true;
		forceTrigger = source.some((s) => /* @__PURE__ */ isReactive(s) || /* @__PURE__ */ isShallow(s));
		getter = () => source.map((s) => {
			if (/* @__PURE__ */ isRef(s)) return s.value;
			else if (/* @__PURE__ */ isReactive(s)) return reactiveGetter(s);
			else if (isFunction(s)) return call ? call(s, 2) : s();
		});
	} else if (isFunction(source)) {
		if (cb) getter = call ? () => call(source, 2) : source;
		else getter = () => {
			if (cleanup) {
				pauseTracking();
				try {
					cleanup();
				} finally {
					resetTracking();
				}
			}
			const currentEffect = activeWatcher;
			activeWatcher = effect;
			try {
				return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
			} finally {
				activeWatcher = currentEffect;
			}
		};
	} else getter = NOOP;
	if (cb && deep) {
		const baseGetter = getter;
		const depth = deep === true ? Infinity : deep;
		getter = () => traverse(baseGetter(), depth);
	}
	const scope = getCurrentScope();
	const watchHandle = () => {
		effect.stop();
		if (scope && scope.active) remove(scope.effects, effect);
	};
	if (once && cb) {
		const _cb = cb;
		cb = (...args) => {
			try {
				return _cb(...args);
			} finally {
				watchHandle();
			}
		};
	}
	let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
	const job = (immediateFirstRun) => {
		if (!(effect.flags & 1) || !effect.dirty && !immediateFirstRun) return;
		if (cb) {
			const newValue = effect.run();
			if (immediateFirstRun || deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
				const currentWatcher = activeWatcher;
				pauseTracking();
				try {
					if (cleanup) cleanup();
					activeWatcher = effect;
					const args = [
						newValue,
						oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
						boundCleanup
					];
					oldValue = newValue;
					call ? call(cb, 3, args) : cb(...args);
				} finally {
					activeWatcher = currentWatcher;
					resetTracking();
				}
			}
		} else effect.run();
	};
	if (augmentJob) augmentJob(job);
	effect = new ReactiveEffect(getter);
	effect.scheduler = scheduler ? () => scheduler(job, false) : job;
	boundCleanup = (fn) => onWatcherCleanup(fn, false, effect);
	cleanup = effect.onStop = () => {
		const cleanups = cleanupMap.get(effect);
		if (cleanups) {
			if (call) call(cleanups, 4);
			else for (const cleanup2 of cleanups) cleanup2();
			cleanupMap.delete(effect);
		}
	};
	if (cb) {
		if (immediate) job(true);
		else oldValue = effect.run();
	} else if (scheduler) scheduler(job.bind(null, true), true);
	else effect.run();
	watchHandle.pause = effect.pause.bind(effect);
	watchHandle.resume = effect.resume.bind(effect);
	watchHandle.stop = watchHandle;
	return watchHandle;
}
function traverse(value, depth = Infinity, seen) {
	if (depth <= 0 || !isObject(value) || value["__v_skip"]) return value;
	seen = seen || /* @__PURE__ */ new Map();
	if ((seen.get(value) || 0) >= depth) return value;
	seen.set(value, depth);
	depth--;
	if (/* @__PURE__ */ isRef(value)) traverse(value.value, depth, seen);
	else if (isArray(value)) for (let i = 0; i < value.length; i++) traverse(value[i], depth, seen);
	else if (isSet(value) || isMap(value)) value.forEach((v) => {
		traverse(v, depth, seen);
	});
	else if (isPlainObject(value)) {
		for (const key in value) traverse(value[key], depth, seen);
		for (const key of Object.getOwnPropertySymbols(value)) if (Object.prototype.propertyIsEnumerable.call(value, key)) traverse(value[key], depth, seen);
	}
	return value;
}
// node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
/**
* @vue/runtime-core v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function callWithErrorHandling(fn, instance, type, args) {
	try {
		return args ? fn(...args) : fn();
	} catch (err) {
		handleError(err, instance, type);
	}
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
	if (isFunction(fn)) {
		const res = callWithErrorHandling(fn, instance, type, args);
		if (res && isPromise(res)) res.catch((err) => {
			handleError(err, instance, type, void 0, true);
		});
		return res;
	}
	if (isArray(fn)) {
		const values = [];
		for (let i = 0; i < fn.length; i++) values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
		return values;
	}
}
function handleError(err, instance, type, throwInDev = true, isAsyncError = false) {
	const contextVNode = instance ? instance.vnode : null;
	const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
	if (instance) {
		let cur = instance.parent;
		const exposedInstance = instance.proxy;
		const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
		while (cur) {
			const errorCapturedHooks = cur.ec;
			if (errorCapturedHooks && !cur.isUnmounted && (!isAsyncError || cur.scope.active)) {
				for (let i = 0; i < errorCapturedHooks.length; i++) if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) return;
			}
			cur = cur.parent;
		}
		if (errorHandler) {
			pauseTracking();
			callWithErrorHandling(errorHandler, null, 10, [
				err,
				exposedInstance,
				errorInfo
			]);
			resetTracking();
			return;
		}
	}
	logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
	if (throwInProd) throw err;
	else console.error(err);
}
var queue = [];
var flushIndex = -1;
var pendingPostFlushCbs = [];
var activePostFlushCbs = null;
var postFlushIndex = 0;
var resolvedPromise = /* @__PURE__ */ Promise.resolve();
var currentFlushPromise = null;
function nextTick(fn) {
	const p = currentFlushPromise || resolvedPromise;
	return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
function findInsertionIndex(id) {
	let start = flushIndex + 1;
	let end = queue.length;
	while (start < end) {
		const middle = start + end >>> 1;
		const middleJob = queue[middle];
		const middleJobId = getId(middleJob);
		if (middleJobId < id || middleJobId === id && middleJob.flags & 2) start = middle + 1;
		else end = middle;
	}
	return start;
}
function queueJob(job) {
	if (!(job.flags & 1)) {
		const jobId = getId(job);
		const lastJob = queue[queue.length - 1];
		if (!lastJob || !(job.flags & 2) && jobId >= getId(lastJob)) queue.push(job);
		else queue.splice(findInsertionIndex(jobId), 0, job);
		job.flags |= 1;
		queueFlush();
	}
}
function queueFlush() {
	if (!currentFlushPromise) currentFlushPromise = resolvedPromise.then(flushJobs);
}
function queuePostFlushCb(cb) {
	if (!isArray(cb)) {
		if (activePostFlushCbs && cb.id === -1) activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
		else if (!(cb.flags & 1)) {
			pendingPostFlushCbs.push(cb);
			cb.flags |= 1;
		}
	} else for (let i = 0; i < cb.length; i++) pendingPostFlushCbs.push(cb[i]);
	queueFlush();
}
function flushPreFlushCbs(instance, minUid, seen, i = flushIndex + 1) {
	for (; i < queue.length; i++) {
		const cb = queue[i];
		if (cb && cb.flags & 2) {
			if (instance && cb.id !== instance.uid || minUid !== void 0 && !(cb.id >= minUid)) continue;
			queue.splice(i, 1);
			i = instance ? i - 1 : flushIndex;
			if (cb.flags & 4) cb.flags &= -2;
			cb();
			if (!(cb.flags & 4)) cb.flags &= -2;
		}
	}
}
function flushPostFlushCbs(seen, skip, minUid = 0) {
	if (pendingPostFlushCbs.length) {
		let cbs = pendingPostFlushCbs;
		let kept = 0;
		if (skip) {
			cbs = [];
			for (let i = 0; i < pendingPostFlushCbs.length; i++) {
				const cb = pendingPostFlushCbs[i];
				if (cb.i !== void 0 ? !cb.i || cb.i.uid < minUid : skip.has(cb)) pendingPostFlushCbs[kept++] = cb;
				else cbs.push(cb);
			}
		}
		const deduped = [...new Set(cbs)].sort((a, b) => getId(a) - getId(b));
		pendingPostFlushCbs.length = kept;
		if (activePostFlushCbs) {
			for (let i = 0; i < deduped.length; i++) activePostFlushCbs.push(deduped[i]);
			return;
		}
		activePostFlushCbs = deduped;
		for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
			const cb = activePostFlushCbs[postFlushIndex];
			if (cb.flags & 4) cb.flags &= -2;
			if (!(cb.flags & 8)) cb();
			cb.flags &= -2;
		}
		activePostFlushCbs = null;
		postFlushIndex = 0;
	}
}
var isFlushing = false;
function flushOnAppMount(fn, minUid) {
	if (isFlushing) {
		fn();
		return;
	}
	const queued = minUid === void 0 ? void 0 : new Set(pendingPostFlushCbs);
	fn();
	isFlushing = true;
	try {
		flushPreFlushCbs(void 0, minUid);
		flushPostFlushCbs(void 0, queued, minUid);
	} finally {
		isFlushing = false;
	}
}
var getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen) {
	try {
		for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex];
			if (job && !(job.flags & 8)) {
				if (job.flags & 4) job.flags &= -2;
				callWithErrorHandling(job, job.i, job.i ? 15 : 14);
				if (!(job.flags & 4)) job.flags &= -2;
			}
		}
	} finally {
		for (; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex];
			if (job) job.flags &= -2;
		}
		flushIndex = -1;
		queue.length = 0;
		flushPostFlushCbs(seen);
		currentFlushPromise = null;
		if (queue.length || pendingPostFlushCbs.length) flushJobs(seen);
	}
}
var currentRenderingInstance = null;
var currentScopeId = null;
function setCurrentRenderingInstance(instance) {
	const prev = currentRenderingInstance;
	currentRenderingInstance = instance;
	currentScopeId = instance && instance.type.__scopeId || null;
	return prev;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
	if (!ctx) return fn;
	if (fn._n) return fn;
	const renderFnWithContext = (...args) => {
		if (renderFnWithContext._d) setBlockTracking(-1);
		const prevInstance = setCurrentRenderingInstance(ctx);
		const prevStackSize = blockStack.length;
		let res;
		try {
			res = fn(...args);
		} finally {
			for (let i = blockStack.length; i > prevStackSize; i--) closeBlock();
			setCurrentRenderingInstance(prevInstance);
			if (renderFnWithContext._d) setBlockTracking(1);
		}
		return res;
	};
	renderFnWithContext._n = true;
	renderFnWithContext._c = true;
	renderFnWithContext._d = true;
	return renderFnWithContext;
}
function withDirectives(vnode, directives) {
	if (currentRenderingInstance === null) return vnode;
	const instance = getComponentPublicInstance(currentRenderingInstance);
	const bindings = vnode.dirs || (vnode.dirs = []);
	for (let i = 0; i < directives.length; i++) {
		let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
		if (dir) {
			if (isFunction(dir)) dir = {
				mounted: dir,
				updated: dir
			};
			if (dir.deep) traverse(value);
			bindings.push({
				dir,
				instance,
				value,
				oldValue: void 0,
				arg,
				modifiers
			});
		}
	}
	return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
	let hookVNode = vnode;
	if (name === "beforeMount") vnode._mount = vnode;
	else if (name === "beforeUpdate") {
		const mount = prevVNode && prevVNode._mount;
		if (mount) {
			mount._latest = vnode;
			vnode._mount = mount;
		}
	} else if (name === "mounted") {
		const latest = vnode._latest;
		vnode._mount = vnode._latest = void 0;
		if (latest) {
			hookVNode = latest;
			latest._mount = void 0;
		}
	}
	const bindings = hookVNode.dirs;
	const oldBindings = prevVNode && prevVNode.dirs;
	for (let i = 0; i < bindings.length; i++) {
		let binding = bindings[i];
		if (oldBindings) binding.oldValue = oldBindings[i].value;
		else if (name === "mounted" && binding.oldValue !== void 0) binding = extend({}, binding, { oldValue: void 0 });
		let hook = binding.dir[name];
		if (hook) {
			pauseTracking();
			callWithAsyncErrorHandling(hook, instance, 8, [
				vnode.el,
				binding,
				hookVNode,
				prevVNode
			]);
			resetTracking();
		}
	}
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
	const instance = getCurrentInstance();
	if (instance || currentApp) {
		let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
		if (provides && key in provides) return provides[key];
		else if (arguments.length > 1) return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
	}
}
var ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
var useSSRContext = () => {
	{
		const ctx = inject(ssrContextKey);
		if (!ctx) {}
		return ctx;
	}
};
function watch(source, cb, options) {
	return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
	const { immediate, deep, flush, once } = options;
	const baseWatchOptions = extend({}, options);
	const runsImmediately = cb && immediate || !cb && flush !== "post";
	let ssrCleanup;
	if (isInSSRComponentSetup) {
		if (flush === "sync") {
			const ctx = useSSRContext();
			ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
		} else if (!runsImmediately) {
			const watchStopHandle = () => {};
			watchStopHandle.stop = NOOP;
			watchStopHandle.resume = NOOP;
			watchStopHandle.pause = NOOP;
			return watchStopHandle;
		}
	}
	const instance = currentInstance;
	baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
	let isPre = false;
	if (flush === "post") baseWatchOptions.scheduler = (job) => {
		job.i = instance;
		queuePostRenderEffect(job, instance && instance.suspense);
	};
	else if (flush !== "sync") {
		isPre = true;
		baseWatchOptions.scheduler = (job, isFirstRun) => {
			if (isFirstRun) job();
			else queueJob(job);
		};
	}
	baseWatchOptions.augmentJob = (job) => {
		if (cb) job.flags |= 4;
		if (isPre) {
			job.flags |= 2;
			if (instance) {
				job.id = instance.uid;
				job.i = instance;
			}
		}
	};
	const watchHandle = watch$1(source, cb, baseWatchOptions);
	if (isInSSRComponentSetup) {
		if (ssrCleanup) ssrCleanup.push(watchHandle);
		else if (runsImmediately) watchHandle();
	}
	return watchHandle;
}
var TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
var isTeleport = (type) => type.__isTeleport;
var leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
function findNonCommentChild(children) {
	let child = children[0];
	if (children.length > 1) {
		for (const c of children) if (c.type !== Comment) {
			child = c;
			break;
		}
	}
	return child;
}
function getInnerChild$1(vnode) {
	if (!isKeepAlive(vnode)) {
		if (isTeleport(vnode.type) && vnode.children) return findNonCommentChild(vnode.children);
		return vnode;
	}
	if (vnode.component) return vnode.component.subTree;
	const { shapeFlag, children } = vnode;
	if (children) {
		if (shapeFlag & 16) return children[0];
		if (shapeFlag & 32 && isFunction(children.default)) return children.default();
	}
}
function setTransitionHooks(vnode, hooks) {
	if (vnode.shapeFlag & 6 && vnode.component) {
		vnode.transition = hooks;
		const subTree = vnode.component.subTree;
		setTransitionHooks(isTeleport(subTree.type) ? getInnerChild$1(subTree) || subTree : subTree, hooks);
	} else if (vnode.shapeFlag & 128) {
		const suspense = vnode.suspense;
		if (suspense) {
			const branch = suspense.isHydrating ? suspense.pendingBranch : suspense.activeBranch;
			if (branch) setTransitionHooks(branch, hooks.clone(branch));
		} else {
			vnode.ssContent.transition = hooks.clone(vnode.ssContent);
			vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
		}
	} else {
		vnode.transition = hooks;
		if (vnode.type === Fragment && isArray(vnode.children)) {
			const child = filterSingleRoot(vnode.children, false);
			if (child) setTransitionHooks(child, hooks);
		}
	}
}
function getTransitionRoot(vnode) {
	if (vnode.component) return getTransitionRoot(vnode.component.subTree);
	if (vnode.type === Fragment) {
		const child = isArray(vnode.children) && filterSingleRoot(vnode.children, false);
		return child ? getTransitionRoot(child) : void 0;
	}
	if (vnode.type !== Comment) return vnode;
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
	return isFunction(options) ? /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))() : options;
}
function markAsyncBoundary(instance) {
	instance.ids = [
		instance.ids[0] + instance.ids[2]++ + "-",
		0,
		0
	];
}
function isTemplateRefKey(refs, key) {
	let desc;
	return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
var pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
	if (isArray(rawRef)) {
		rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
		return;
	}
	if (isAsyncWrapper(vnode) && !isUnmount) {
		if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
		return;
	}
	const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
	const value = isUnmount ? null : refValue;
	const { i: owner, r: ref } = rawRef;
	const oldRef = oldRawRef && oldRawRef.r;
	const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
	const setupState = owner.setupState;
	const rawSetupState = /* @__PURE__ */ toRaw(setupState);
	const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
		if (isTemplateRefKey(refs, key)) return false;
		return hasOwn(rawSetupState, key);
	};
	const canSetRef = (ref2, key) => {
		if (key && isTemplateRefKey(refs, key)) return false;
		return true;
	};
	if (oldRef != null && oldRef !== ref) {
		invalidatePendingSetRef(oldRawRef);
		if (isString(oldRef)) {
			refs[oldRef] = null;
			if (canSetSetupRef(oldRef)) setupState[oldRef] = null;
		} else if (/* @__PURE__ */ isRef(oldRef)) {
			const oldRawRefAtom = oldRawRef;
			if (canSetRef(oldRef, oldRawRefAtom.k)) oldRef.value = null;
			if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
		}
	}
	if (isFunction(ref)) callWithErrorHandling(ref, owner, 12, [value, refs]);
	else {
		const _isString = isString(ref);
		const _isRef = /* @__PURE__ */ isRef(ref);
		if (_isString || _isRef) {
			const doSet = () => {
				if (rawRef.f) {
					const existing = _isString ? canSetSetupRef(ref) ? setupState[ref] : refs[ref] : canSetRef(ref) || !rawRef.k ? ref.value : refs[rawRef.k];
					if (isUnmount) isArray(existing) && remove(existing, refValue);
					else if (!isArray(existing)) {
						if (_isString) {
							refs[ref] = [refValue];
							if (canSetSetupRef(ref)) setupState[ref] = refs[ref];
						} else {
							const newVal = [refValue];
							if (canSetRef(ref, rawRef.k)) ref.value = newVal;
							if (rawRef.k) refs[rawRef.k] = newVal;
						}
					} else if (!existing.includes(refValue)) existing.push(refValue);
				} else if (_isString) {
					refs[ref] = value;
					if (canSetSetupRef(ref)) setupState[ref] = value;
				} else if (_isRef) {
					if (canSetRef(ref, rawRef.k)) ref.value = value;
					if (rawRef.k) refs[rawRef.k] = value;
				}
			};
			if (value) {
				const job = () => {
					doSet();
					pendingSetRefMap.delete(rawRef);
				};
				job.id = -1;
				pendingSetRefMap.set(rawRef, job);
				queuePostRenderEffect(job, parentSuspense);
			} else {
				invalidatePendingSetRef(rawRef);
				doSet();
			}
		}
	}
}
function invalidatePendingSetRef(rawRef) {
	const pendingSetRef = pendingSetRefMap.get(rawRef);
	if (pendingSetRef) {
		pendingSetRef.flags |= 8;
		pendingSetRefMap.delete(rawRef);
	}
}
getGlobalThis().requestIdleCallback;
getGlobalThis().cancelIdleCallback;
var isAsyncWrapper = (i) => !!i.type.__asyncLoader;
var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function injectHook(type, hook, target = currentInstance, prepend = false) {
	if (target) {
		const hooks = target[type] || (target[type] = []);
		const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
			pauseTracking();
			const reset = setCurrentInstance(target);
			const res = callWithAsyncErrorHandling(hook, target, type, args);
			reset();
			resetTracking();
			return res;
		});
		if (prepend) hooks.unshift(wrappedHook);
		else hooks.push(wrappedHook);
		return wrappedHook;
	}
}
var createHook = (lifecycle) => (hook, target = currentInstance) => {
	if (!isInSSRComponentSetup || lifecycle === "sp") injectHook(lifecycle, (...args) => hook(...args), target);
};
var onMounted = createHook("m");
var onBeforeUnmount = createHook("bum");
var COMPONENTS = "components";
function resolveComponent(name, maybeSelfReference) {
	return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
var NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
	const instance = currentRenderingInstance || currentInstance;
	if (instance) {
		const Component = instance.type;
		if (type === COMPONENTS) {
			const selfName = getComponentName(Component, false);
			if (selfName && (selfName === name || selfName === camelize(name) || selfName === capitalize(camelize(name)))) return Component;
		}
		const res = resolve(instance[type] || Component[type], name) || resolve(instance.appContext[type], name);
		if (!res && maybeSelfReference) return Component;
		return res;
	}
}
function resolve(registry, name) {
	return registry && (registry[name] || registry[camelize(name)] || registry[capitalize(camelize(name))]);
}
function renderList(source, renderItem, cache, index) {
	let ret;
	const cached = cache && cache[index];
	const sourceIsArray = isArray(source);
	if (sourceIsArray || isString(source)) {
		const sourceIsReactiveArray = sourceIsArray && /* @__PURE__ */ isReactive(source);
		let needsWrap = false;
		let isReadonlySource = false;
		if (sourceIsReactiveArray) {
			needsWrap = !/* @__PURE__ */ isShallow(source);
			isReadonlySource = /* @__PURE__ */ isReadonly(source);
			source = shallowReadArray(source);
		}
		ret = new Array(source.length);
		for (let i = 0, l = source.length; i < l; i++) ret[i] = renderItem(needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i], i, void 0, cached && cached[i]);
	} else if (typeof source === "number") {
		if (!Number.isInteger(source) || source < 0) ret = [];
		else {
			ret = new Array(source);
			for (let i = 0; i < source; i++) ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
		}
	} else if (isObject(source)) {
		if (source[Symbol.iterator]) ret = Array.from(source, (item, i) => renderItem(item, i, void 0, cached && cached[i]));
		else {
			const keys = Object.keys(source);
			ret = new Array(keys.length);
			for (let i = 0, l = keys.length; i < l; i++) {
				const key = keys[i];
				ret[i] = renderItem(source[key], key, i, cached && cached[i]);
			}
		}
	} else ret = [];
	if (cache) cache[index] = ret;
	return ret;
}
var getPublicInstance = (i) => {
	if (!i) return null;
	if (isStatefulComponent(i)) return getComponentPublicInstance(i);
	return getPublicInstance(i.parent);
};
var publicPropertiesMap = /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
	$: (i) => i,
	$el: (i) => i.vnode.el,
	$data: (i) => i.data,
	$props: (i) => i.props,
	$attrs: (i) => i.attrs,
	$slots: (i) => i.slots,
	$refs: (i) => i.refs,
	$parent: (i) => getPublicInstance(i.parent),
	$root: (i) => getPublicInstance(i.root),
	$host: (i) => i.ce,
	$emit: (i) => i.emit,
	$options: (i) => i.type,
	$forceUpdate: (i) => i.f || (i.f = () => {
		queueJob(i.update);
	}),
	$nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
	$watch: (i) => NOOP
});
var hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
var PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		if (key === "__v_skip") return true;
		const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
		if (key[0] !== "$") {
			const n = accessCache[key];
			if (n !== void 0) switch (n) {
				case 1: return setupState[key];
				case 2: return data[key];
				case 4: return ctx[key];
				case 3: return props[key];
			}
			else if (hasSetupBinding(setupState, key)) {
				accessCache[key] = 1;
				return setupState[key];
			} else if (hasOwn(props, key)) {
				accessCache[key] = 3;
				return props[key];
			} else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
				accessCache[key] = 4;
				return ctx[key];
			} else accessCache[key] = 0;
		}
		const publicGetter = publicPropertiesMap[key];
		let cssModule, globalProperties;
		if (publicGetter) {
			if (key === "$attrs") track(instance.attrs, "get", "");
			return publicGetter(instance);
		} else if ((cssModule = type.__cssModules) && (cssModule = cssModule[key])) return cssModule;
		else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
			accessCache[key] = 4;
			return ctx[key];
		} else if (globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)) return globalProperties[key];
	},
	set({ _: instance }, key, value) {
		const { data, setupState, ctx } = instance;
		if (hasSetupBinding(setupState, key)) {
			setupState[key] = value;
			return true;
		} else if (hasOwn(instance.props, key)) return false;
		if (key[0] === "$" && key.slice(1) in instance) return false;
		else ctx[key] = value;
		return true;
	},
	has({ _: { data, setupState, accessCache, ctx, appContext, props, type } }, key) {
		let cssModules;
		return !!(accessCache[key] || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
	},
	defineProperty(target, key, descriptor) {
		if (descriptor.get != null) target._.accessCache[key] = 0;
		else if (hasOwn(descriptor, "value")) this.set(target, key, descriptor.value, null);
		return Reflect.defineProperty(target, key, descriptor);
	}
};
function createAppContext() {
	return {
		app: null,
		config: {
			isNativeTag: NO,
			performance: false,
			globalProperties: {},
			optionMergeStrategies: {},
			errorHandler: void 0,
			warnHandler: void 0,
			compilerOptions: {}
		},
		mixins: [],
		components: {},
		directives: {},
		provides: /* @__PURE__ */ Object.create(null),
		optionsCache: /* @__PURE__ */ new WeakMap(),
		propsCache: /* @__PURE__ */ new WeakMap(),
		emitsCache: /* @__PURE__ */ new WeakMap()
	};
}
var uid$1 = 0;
function createAppAPI(render, hydrate) {
	return function createApp(rootComponent, rootProps = null) {
		if (!isFunction(rootComponent)) rootComponent = extend({}, rootComponent);
		if (rootProps != null && !isObject(rootProps)) rootProps = null;
		const context = createAppContext();
		const installedPlugins = /* @__PURE__ */ new WeakSet();
		const pluginCleanupFns = [];
		let isMounted = false;
		const app = context.app = {
			_uid: uid$1++,
			_component: rootComponent,
			_props: rootProps,
			_container: null,
			_context: context,
			_instance: null,
			version,
			get config() {
				return context.config;
			},
			set config(v) {},
			use(plugin, ...options) {
				if (installedPlugins.has(plugin)) {} else if (plugin && isFunction(plugin.install)) {
					installedPlugins.add(plugin);
					plugin.install(app, ...options);
				} else if (isFunction(plugin)) {
					installedPlugins.add(plugin);
					plugin(app, ...options);
				}
				return app;
			},
			mixin(mixin) {
				return app;
			},
			component(name, component) {
				if (!component) return context.components[name];
				context.components[name] = component;
				return app;
			},
			directive(name, directive) {
				if (!directive) return context.directives[name];
				context.directives[name] = directive;
				return app;
			},
			mount(rootContainer, isHydrate, namespace) {
				if (!isMounted) {
					const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
					vnode.appContext = context;
					if (namespace === true) namespace = "svg";
					else if (namespace === false) namespace = void 0;
					if (isHydrate && hydrate) hydrate(vnode, rootContainer);
					else render(vnode, rootContainer, namespace);
					isMounted = true;
					app._container = rootContainer;
					rootContainer.__vue_app__ = app;
					return getComponentPublicInstance(vnode.component);
				}
			},
			onUnmount(cleanupFn) {
				pluginCleanupFns.push(cleanupFn);
			},
			unmount() {
				if (isMounted) {
					callWithAsyncErrorHandling(pluginCleanupFns, app._instance, 16);
					render(null, app._container);
					delete app._container.__vue_app__;
				}
			},
			provide(key, value) {
				context.provides[key] = value;
				return app;
			},
			runWithContext(fn) {
				const lastApp = currentApp;
				currentApp = app;
				try {
					return fn();
				} finally {
					currentApp = lastApp;
				}
			}
		};
		return app;
	};
}
var currentApp = null;
var getModelModifiers = (props, modelName) => {
	return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance, event, ...rawArgs) {
	if (instance.isUnmounted) return;
	const props = instance.vnode.props || EMPTY_OBJ;
	let args = rawArgs;
	const isModelListener = event.startsWith("update:");
	const modifiers = isModelListener && getModelModifiers(props, event.slice(7));
	if (modifiers) {
		if (modifiers.trim) args = rawArgs.map((a) => isString(a) ? a.trim() : a);
		if (modifiers.number) args = args.map(looseToNumber);
	}
	let handlerName;
	let handler = props[handlerName = toHandlerKey(event)] || props[handlerName = toHandlerKey(camelize(event))];
	if (!handler && isModelListener) handler = props[handlerName = toHandlerKey(hyphenate(event))];
	if (handler) callWithAsyncErrorHandling(handler, instance, 6, args);
	const onceHandler = props[handlerName + `Once`];
	if (onceHandler) {
		if (!instance.emitted) instance.emitted = {};
		else if (instance.emitted[handlerName]) return;
		instance.emitted[handlerName] = true;
		callWithAsyncErrorHandling(onceHandler, instance, 6, args);
	}
}
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
	const cache = appContext.emitsCache;
	const cached = cache.get(comp);
	if (cached !== void 0) return cached;
	const raw = comp.emits;
	let normalized = {};
	if (!raw && true) {
		if (isObject(comp)) cache.set(comp, null);
		return null;
	}
	if (isArray(raw)) raw.forEach((key) => normalized[key] = null);
	else extend(normalized, raw);
	if (isObject(comp)) cache.set(comp, normalized);
	return normalized;
}
function isEmitListener(options, key) {
	if (!options || !isOn(key)) return false;
	key = key.slice(2);
	key = key === "Once" ? key : key.replace(/Once$/, "");
	return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
function renderComponentRoot(instance) {
	const { type: Component, vnode, proxy, withProxy, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, props, data, setupState, ctx, inheritAttrs } = instance;
	const prev = setCurrentRenderingInstance(instance);
	let result;
	let fallthroughAttrs;
	try {
		if (vnode.shapeFlag & 4) {
			const proxyToUse = withProxy || proxy;
			const thisProxy = proxyToUse;
			result = normalizeVNode(render.call(thisProxy, proxyToUse, renderCache, props, setupState, data, ctx));
			fallthroughAttrs = attrs;
		} else {
			const render2 = Component;
			result = normalizeVNode(render2.length > 1 ? render2(props, {
				attrs,
				slots,
				emit
			}) : render2(props, null));
			fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
		}
	} catch (err) {
		blockStack.length = 0;
		handleError(err, instance, 1);
		result = createVNode(Comment);
	}
	let root = result;
	if (fallthroughAttrs && inheritAttrs !== false) {
		const keys = Object.keys(fallthroughAttrs);
		const { shapeFlag } = root;
		if (keys.length) {
			if (shapeFlag & 7) {
				if (propsOptions && keys.some(isModelListener)) fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
				root = cloneVNode(root, fallthroughAttrs, false, true);
			}
		}
	}
	if (vnode.dirs) {
		root = cloneVNode(root, null, false, true);
		root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
	}
	if (vnode.transition) setTransitionHooks(isTeleport(root.type) ? getInnerChild$1(root) || root : root, vnode.transition);
	result = root;
	setCurrentRenderingInstance(prev);
	return result;
}
function filterSingleRoot(children, recurse = true) {
	let singleRoot;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (isVNode(child)) {
			if (child.type !== Comment || child.children === "v-if") {
				if (singleRoot) return;
				else singleRoot = child;
			}
		} else return;
	}
	return singleRoot;
}
var getFunctionalFallthrough = (attrs) => {
	let res;
	for (const key in attrs) if (key === "class" || key === "style" || isOn(key)) (res || (res = {}))[key] = attrs[key];
	return res;
};
var filterModelListeners = (attrs, props) => {
	const res = {};
	for (const key in attrs) if (!isModelListener(key) || !(key.slice(9) in props)) res[key] = attrs[key];
	return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
	const { props: prevProps, children: prevChildren, component } = prevVNode;
	const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
	const emits = component.emitsOptions;
	if (nextVNode.dirs || nextVNode.transition) return true;
	if (optimized && patchFlag >= 0) {
		if (patchFlag & 1024) return true;
		if (patchFlag & 16) {
			if (!prevProps) return !!nextProps;
			return hasPropsChanged(prevProps, nextProps, emits);
		} else if (patchFlag & 8) {
			const dynamicProps = nextVNode.dynamicProps;
			for (let i = 0; i < dynamicProps.length; i++) {
				const key = dynamicProps[i];
				if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) return true;
			}
		}
	} else {
		if (prevChildren || nextChildren) {
			if (!nextChildren || !nextChildren.$stable) return true;
		}
		if (prevProps === nextProps) return false;
		if (!prevProps) return !!nextProps;
		if (!nextProps) return true;
		return hasPropsChanged(prevProps, nextProps, emits);
	}
	return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
	const nextKeys = Object.keys(nextProps);
	if (nextKeys.length !== Object.keys(prevProps).length) return true;
	for (let i = 0; i < nextKeys.length; i++) {
		const key = nextKeys[i];
		if (!hasOwn(prevProps, key) || hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) return true;
	}
	return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
	const nextProp = nextProps[key];
	const prevProp = prevProps[key];
	if (key === "style" && isObject(nextProp) && isObject(prevProp)) return !looseEqual(nextProp, prevProp);
	return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent, suspense }, el) {
	while (parent) {
		const root = parent.subTree;
		if (root.suspense && root.suspense.activeBranch === vnode) {
			root.suspense.vnode.el = root.el = el;
			vnode = root;
		}
		if (root === vnode) {
			(vnode = parent.vnode).el = el;
			parent = parent.parent;
		} else break;
	}
	if (suspense && suspense.activeBranch === vnode) suspense.vnode.el = el;
}
var internalObjectProto = {};
var createInternalObject = () => Object.create(internalObjectProto);
var isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance, rawProps, isStateful, isSSR = false) {
	const props = {};
	const attrs = createInternalObject();
	instance.propsDefaults = /* @__PURE__ */ Object.create(null);
	setFullProps(instance, rawProps, props, attrs);
	for (const key in instance.propsOptions[0]) if (!(key in props)) props[key] = void 0;
	if (isStateful) instance.props = isSSR ? props : /* @__PURE__ */ shallowReactive(props);
	else if (!instance.type.props) instance.props = attrs;
	else instance.props = props;
	instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
	const { props, attrs, vnode: { patchFlag } } = instance;
	const rawCurrentProps = /* @__PURE__ */ toRaw(props);
	const [options] = instance.propsOptions;
	let hasAttrsChanged = false;
	if ((optimized || patchFlag > 0) && !(patchFlag & 16)) {
		if (patchFlag & 8) {
			const propsToUpdate = instance.vnode.dynamicProps;
			for (let i = 0; i < propsToUpdate.length; i++) {
				let key = propsToUpdate[i];
				if (isEmitListener(instance.emitsOptions, key)) continue;
				const value = rawProps[key];
				if (options) {
					if (hasOwn(attrs, key)) {
						if (value !== attrs[key]) {
							attrs[key] = value;
							hasAttrsChanged = true;
						}
					} else {
						const camelizedKey = camelize(key);
						props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false);
					}
				} else if (value !== attrs[key]) {
					attrs[key] = value;
					hasAttrsChanged = true;
				}
			}
		}
	} else {
		if (setFullProps(instance, rawProps, props, attrs)) hasAttrsChanged = true;
		let kebabKey;
		for (const key in rawCurrentProps) if (!rawProps || !hasOwn(rawProps, key) && ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
			if (options) {
				if (rawPrevProps && (rawPrevProps[key] !== void 0 || rawPrevProps[kebabKey] !== void 0)) props[key] = resolvePropValue(options, rawCurrentProps, key, void 0, instance, true);
			} else delete props[key];
		}
		if (attrs !== rawCurrentProps) {
			for (const key in attrs) if (!rawProps || !hasOwn(rawProps, key) && true) {
				delete attrs[key];
				hasAttrsChanged = true;
			}
		}
	}
	if (hasAttrsChanged) trigger(instance.attrs, "set", "");
}
function setFullProps(instance, rawProps, props, attrs) {
	const [options, needCastKeys] = instance.propsOptions;
	let hasAttrsChanged = false;
	let rawCastValues;
	if (rawProps) for (let key in rawProps) {
		if (isReservedProp(key)) continue;
		const value = rawProps[key];
		let camelKey;
		if (options && hasOwn(options, camelKey = camelize(key))) {
			if (!needCastKeys || !needCastKeys.includes(camelKey)) props[camelKey] = value;
			else (rawCastValues || (rawCastValues = {}))[camelKey] = value;
		} else if (!isEmitListener(instance.emitsOptions, key)) {
			if (!(key in attrs) || value !== attrs[key]) {
				attrs[key] = value;
				hasAttrsChanged = true;
			}
		}
	}
	if (needCastKeys) {
		const rawCurrentProps = /* @__PURE__ */ toRaw(props);
		const castValues = rawCastValues || EMPTY_OBJ;
		for (let i = 0; i < needCastKeys.length; i++) {
			const key = needCastKeys[i];
			props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
		}
	}
	return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
	const opt = options[key];
	if (opt != null) {
		const hasDefault = hasOwn(opt, "default");
		if (hasDefault && value === void 0) {
			const defaultValue = opt.default;
			if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
				const { propsDefaults } = instance;
				if (key in propsDefaults) value = propsDefaults[key];
				else {
					const reset = setCurrentInstance(instance);
					value = propsDefaults[key] = defaultValue.call(null, props);
					reset();
				}
			} else value = defaultValue;
			if (instance.ce) instance.ce._setProp(key, value);
		}
		if (opt[0]) {
			if (isAbsent && !hasDefault) value = false;
			else if (opt[1] && (value === "" || value === hyphenate(key))) value = true;
		}
	}
	return value;
}
function normalizePropsOptions(comp, appContext, asMixin = false) {
	const cache = appContext.propsCache;
	const cached = cache.get(comp);
	if (cached) return cached;
	const raw = comp.props;
	const normalized = {};
	const needCastKeys = [];
	if (!raw && true) {
		if (isObject(comp)) cache.set(comp, EMPTY_ARR);
		return EMPTY_ARR;
	}
	if (isArray(raw)) for (let i = 0; i < raw.length; i++) {
		const normalizedKey = camelize(raw[i]);
		if (validatePropName(normalizedKey)) normalized[normalizedKey] = EMPTY_OBJ;
	}
	else if (raw) for (const key in raw) {
		const normalizedKey = camelize(key);
		if (validatePropName(normalizedKey)) {
			const opt = raw[key];
			const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
			const propType = prop.type;
			let shouldCast = false;
			let shouldCastTrue = true;
			if (isArray(propType)) for (let index = 0; index < propType.length; ++index) {
				const type = propType[index];
				const typeName = isFunction(type) && type.name;
				if (typeName === "Boolean") {
					shouldCast = true;
					break;
				} else if (typeName === "String") shouldCastTrue = false;
			}
			else shouldCast = isFunction(propType) && propType.name === "Boolean";
			prop[0] = shouldCast;
			prop[1] = shouldCastTrue;
			if (shouldCast || hasOwn(prop, "default")) needCastKeys.push(normalizedKey);
		}
	}
	const res = [normalized, needCastKeys];
	if (isObject(comp)) cache.set(comp, res);
	return res;
}
function validatePropName(key) {
	if (key[0] !== "$" && !isReservedProp(key)) return true;
	return false;
}
var isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
var normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
var normalizeSlot = (key, rawSlot, ctx) => {
	if (rawSlot._n) return rawSlot;
	const normalized = withCtx((...args) => {
		return normalizeSlotValue(rawSlot(...args));
	}, ctx);
	normalized._c = false;
	return normalized;
};
var normalizeObjectSlots = (rawSlots, slots, instance) => {
	const ctx = rawSlots._ctx;
	for (const key in rawSlots) {
		if (isInternalKey(key)) continue;
		const value = rawSlots[key];
		if (isFunction(value)) slots[key] = normalizeSlot(key, value, ctx);
		else if (value != null) {
			const normalized = normalizeSlotValue(value);
			slots[key] = () => normalized;
		}
	}
};
var normalizeVNodeSlots = (instance, children) => {
	const normalized = normalizeSlotValue(children);
	instance.slots.default = () => normalized;
};
var assignSlots = (slots, children, optimized) => {
	for (const key in children) if (optimized || !isInternalKey(key)) slots[key] = children[key];
};
var initSlots = (instance, children, optimized) => {
	const slots = instance.slots = createInternalObject();
	if (instance.vnode.shapeFlag & 32) {
		const type = children._;
		if (type) {
			assignSlots(slots, children, optimized);
			if (optimized) def(slots, "_", type, true);
		} else normalizeObjectSlots(children, slots);
	} else if (children) normalizeVNodeSlots(instance, children);
};
var updateSlots = (instance, children, optimized) => {
	const { vnode, slots } = instance;
	let needDeletionCheck = true;
	let deletionComparisonTarget = EMPTY_OBJ;
	if (vnode.shapeFlag & 32) {
		const type = children._;
		if (type) {
			if (optimized && type === 1) needDeletionCheck = false;
			else assignSlots(slots, children, optimized);
		} else {
			needDeletionCheck = !children.$stable;
			normalizeObjectSlots(children, slots);
		}
		deletionComparisonTarget = children;
	} else if (children) {
		normalizeVNodeSlots(instance, children);
		deletionComparisonTarget = { default: 1 };
	}
	if (needDeletionCheck) {
		for (const key in slots) if (!isInternalKey(key) && deletionComparisonTarget[key] == null) delete slots[key];
	}
};
var queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
	return baseCreateRenderer(options);
}
function baseCreateRenderer(options, createHydrationFns) {
	const target = getGlobalThis();
	target.__VUE__ = true;
	const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, insertStaticContent: hostInsertStaticContent } = options;
	const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
		if (n1 === n2) return;
		if (n1 && !isSameVNodeType(n1, n2)) {
			anchor = getNextHostNode(n1);
			unmount(n1, parentComponent, parentSuspense, true);
			n1 = null;
		}
		if (n2.patchFlag === -2) {
			optimized = false;
			n2.dynamicChildren = null;
		}
		if (n2.dynamicChildren && n1 && n1.dynamicChildren && n1.dynamicChildren.hasOnce) {
			if (n2.dynamicChildren === EMPTY_ARR) n2.dynamicChildren = [];
			n2.dynamicChildren.hasOnce = true;
		}
		const { type, ref, shapeFlag } = n2;
		switch (type) {
			case Text:
				processText(n1, n2, container, anchor);
				break;
			case Comment:
				processCommentNode(n1, n2, container, anchor);
				break;
			case Static:
				if (n1 == null) mountStaticNode(n2, container, anchor, namespace);
				break;
			case Fragment:
				processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				break;
			default: if (shapeFlag & 1) processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else if (shapeFlag & 6) processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else if (shapeFlag & 64) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
			else if (shapeFlag & 128) type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
		}
		if (ref != null && parentComponent) setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
		else if (ref == null && n1 && n1.ref != null) setRef(n1.ref, null, parentSuspense, n1, true);
	};
	const processText = (n1, n2, container, anchor) => {
		if (n1 == null) hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
		else {
			const el = n2.el = n1.el;
			if (n2.children !== n1.children) hostSetText(el, n2.children);
		}
	};
	const processCommentNode = (n1, n2, container, anchor) => {
		if (n1 == null) hostInsert(n2.el = hostCreateComment(n2.children || ""), container, anchor);
		else n2.el = n1.el;
	};
	const mountStaticNode = (n2, container, anchor, namespace) => {
		[n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, namespace, n2.el, n2.anchor);
	};
	const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
		let next;
		while (el && el !== anchor) {
			next = hostNextSibling(el);
			hostInsert(el, container, nextSibling);
			el = next;
		}
		hostInsert(anchor, container, nextSibling);
	};
	const removeStaticNode = ({ el, anchor }) => {
		let next;
		while (el && el !== anchor) {
			next = hostNextSibling(el);
			hostRemove(el);
			el = next;
		}
		hostRemove(anchor);
	};
	const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		if (n2.type === "svg") namespace = "svg";
		else if (n2.type === "math") namespace = "mathml";
		if (n1 == null) mountElement(n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		else {
			const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
			try {
				if (customElement) customElement._beginPatch();
				patchElement(n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			} finally {
				if (customElement) customElement._endPatch();
			}
		}
	};
	const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		let el;
		let vnodeHook;
		const { props, shapeFlag, transition, dirs } = vnode;
		el = vnode.el = hostCreateElement(vnode.type, namespace, props && props.is, props);
		if (shapeFlag & 8) hostSetElementText(el, vnode.children);
		else if (shapeFlag & 16) mountChildren(vnode.children, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(vnode, namespace), slotScopeIds, optimized);
		if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "created");
		setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
		if (props) {
			for (const key in props) if (key !== "value" && !isReservedProp(key)) hostPatchProp(el, key, null, props[key], namespace, parentComponent);
			if ("value" in props) hostPatchProp(el, "value", null, props.value, namespace);
			if (vnodeHook = props.onVnodeBeforeMount) invokeVNodeHook(vnodeHook, parentComponent, vnode);
		}
		if (dirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
		const needCallTransitionHooks = needTransition(parentSuspense, transition);
		if (needCallTransitionHooks) transition.beforeEnter(el);
		else if (transition && !transition.persisted) el[deferredEnterKey] = true;
		hostInsert(el, container, anchor);
		if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) queuePostRenderEffect(() => {
			try {
				vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
				needCallTransitionHooks && transition.enter(el);
				dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
			} finally {}
		}, parentSuspense);
	};
	const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
		if (scopeId) hostSetScopeId(el, scopeId);
		if (slotScopeIds) for (let i = 0; i < slotScopeIds.length; i++) hostSetScopeId(el, slotScopeIds[i]);
		if (parentComponent) {
			let subTree = parentComponent.subTree;
			if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
				const parentVNode = parentComponent.vnode;
				setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
			}
		}
	};
	const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
		for (let i = start; i < children.length; i++) {
			const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
			patch(null, child, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
	};
	const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		const el = n2.el = n1.el;
		let { patchFlag, dynamicChildren, dirs } = n2;
		patchFlag |= n1.patchFlag & 16;
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;
		let vnodeHook;
		parentComponent && toggleRecurse(parentComponent, false);
		if (vnodeHook = newProps.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
		if (dirs) invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
		parentComponent && toggleRecurse(parentComponent, true);
		if (dynamicChildren && (!n1.dynamicChildren || n1.dynamicChildren.length !== dynamicChildren.length)) {
			patchFlag = 0;
			optimized = false;
			dynamicChildren = null;
		}
		if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) hostSetElementText(el, "");
		if (dynamicChildren) patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds);
		else if (!optimized) patchChildren(n1, n2, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds, false);
		if (patchFlag > 0) {
			if (patchFlag & 16) patchProps(el, oldProps, newProps, parentComponent, namespace);
			else {
				if (patchFlag & 2) {
					if (oldProps.class !== newProps.class) hostPatchProp(el, "class", null, newProps.class, namespace);
				}
				if (patchFlag & 4) hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
				if (patchFlag & 8) {
					const propsToUpdate = n2.dynamicProps;
					for (let i = 0; i < propsToUpdate.length; i++) {
						const key = propsToUpdate[i];
						const prev = oldProps[key];
						const next = newProps[key];
						if (next !== prev || key === "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
					}
				}
			}
			if (patchFlag & 1) {
				if (n1.children !== n2.children) hostSetElementText(el, n2.children);
			}
		} else if (!optimized && dynamicChildren == null) patchProps(el, oldProps, newProps, parentComponent, namespace);
		if ((vnodeHook = newProps.onVnodeUpdated) || dirs) queuePostRenderEffect(() => {
			vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
			dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
		}, parentSuspense);
	};
	const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
		for (let i = 0; i < newChildren.length; i++) {
			const oldVNode = oldChildren[i];
			const newVNode = newChildren[i];
			const oldEl = oldVNode.el || resolveAsyncComponentPlaceholder(oldVNode);
			const container = oldEl && (oldVNode.type === Fragment || !isSameVNodeType(oldVNode, newVNode) || oldVNode.shapeFlag & 198) ? hostParentNode(oldEl) : fallbackContainer;
			patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, true);
		}
	};
	const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
		if (oldProps !== newProps) {
			if (oldProps !== EMPTY_OBJ) {
				for (const key in oldProps) if (!isReservedProp(key) && !(key in newProps)) hostPatchProp(el, key, oldProps[key], null, namespace, parentComponent);
			}
			for (const key in newProps) {
				if (isReservedProp(key)) continue;
				const next = newProps[key];
				const prev = oldProps[key];
				if (next !== prev && key !== "value") hostPatchProp(el, key, prev, next, namespace, parentComponent);
			}
			if ("value" in newProps) hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
		}
	};
	const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
		const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
		let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
		if (fragmentSlotScopeIds) slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
		if (n1 == null) {
			hostInsert(fragmentStartAnchor, container, anchor);
			hostInsert(fragmentEndAnchor, container, anchor);
			mountChildren(n2.children || [], container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		} else if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
			patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, namespace, slotScopeIds);
			if (n2.key != null || parentComponent && n2 === parentComponent.subTree) traverseStaticChildren(n1, n2, true);
		} else patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
	};
	const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		n2.slotScopeIds = slotScopeIds;
		if (n1 == null) {
			if (n2.shapeFlag & 512) parentComponent.ctx.activate(n2, container, anchor, namespace, optimized);
			else mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized);
		} else updateComponent(n1, n2, optimized);
	};
	const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
		const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense);
		if (isKeepAlive(initialVNode)) instance.ctx.renderer = internals;
		setupComponent(instance, false, optimized);
		if (instance.asyncDep) {
			parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized, namespace);
			if (!initialVNode.el) {
				const placeholder = instance.subTree = createVNode(Comment);
				processCommentNode(null, placeholder, container, anchor);
				initialVNode.placeholder = placeholder.el;
			}
		} else setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, namespace, optimized);
	};
	const updateComponent = (n1, n2, optimized) => {
		const instance = n2.component = n1.component;
		if (shouldUpdateComponent(n1, n2, optimized)) {
			if (instance.asyncDep && !instance.asyncResolved) {
				n2.el = n1.el;
				n2.placeholder = n1.placeholder;
				updateComponentPreRender(instance, n2, optimized);
				return;
			} else {
				instance.next = n2;
				instance.update();
			}
		} else {
			n2.el = n1.el;
			n2.placeholder = n1.placeholder;
			instance.vnode = n2;
		}
	};
	const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
		const componentUpdateFn = () => {
			if (!instance.isMounted) {
				let vnodeHook;
				const { el, props } = initialVNode;
				const { bm, m, parent, root, type } = instance;
				const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
				toggleRecurse(instance, false);
				if (bm) invokeArrayFns(bm);
				if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) invokeVNodeHook(vnodeHook, parent, initialVNode);
				toggleRecurse(instance, true);
				if (el && hydrateNode) {
					const hydrateSubTree = () => {
						instance.subTree = renderComponentRoot(instance);
						hydrateNode(el, instance.subTree, instance, parentSuspense, null);
					};
					if (isAsyncWrapperVNode && type.__asyncHydrate) type.__asyncHydrate(el, instance, hydrateSubTree);
					else hydrateSubTree();
				} else {
					if (root.ce && root.ce._hasShadowRoot()) root.ce._injectChildStyle(type, instance.parent ? instance.parent.type : void 0);
					const subTree = instance.subTree = renderComponentRoot(instance);
					patch(null, subTree, container, anchor, instance, parentSuspense, namespace);
					initialVNode.el = subTree.el;
				}
				if (m) queuePostRenderEffect(m, parentSuspense);
				if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
					const scopedInitialVNode = initialVNode;
					queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
				}
				if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) instance.a && queuePostRenderEffect(instance.a, parentSuspense);
				instance.isMounted = true;
				initialVNode = container = anchor = null;
			} else {
				let { next, bu, u, parent, vnode } = instance;
				{
					const unresolvedAsyncRoot = locateUnresolvedAsyncRoot(instance);
					if (unresolvedAsyncRoot) {
						if (next) {
							next.el = vnode.el;
							updateComponentPreRender(instance, next, optimized);
						}
						unresolvedAsyncRoot.asyncDep.then(() => {
							const retry = () => {
								if (instance.job.flags & 8) return;
								if (parentSuspense && parentSuspense.pendingBranch) queuePostRenderEffect(retry, parentSuspense);
								else update();
							};
							retry.flags = 48;
							queuePostRenderEffect(retry, parentSuspense);
						});
						return;
					}
				}
				let originNext = next;
				let vnodeHook;
				toggleRecurse(instance, false);
				if (next) {
					next.el = vnode.el;
					updateComponentPreRender(instance, next, optimized);
				} else next = vnode;
				if (bu) invokeArrayFns(bu);
				if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) invokeVNodeHook(vnodeHook, parent, next, vnode);
				toggleRecurse(instance, true);
				const nextTree = renderComponentRoot(instance);
				const prevTree = instance.subTree;
				instance.subTree = nextTree;
				patch(prevTree, nextTree, hostParentNode(prevTree.el || resolveAsyncComponentPlaceholder(prevTree)), getNextHostNode(prevTree), instance, parentSuspense, namespace);
				next.el = nextTree.el;
				if (originNext === null) updateHOCHostEl(instance, nextTree.el);
				if (u) queuePostRenderEffect(u, parentSuspense);
				if (vnodeHook = next.props && next.props.onVnodeUpdated) queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
			}
		};
		instance.scope.on();
		const effect = instance.effect = new ReactiveEffect(componentUpdateFn);
		instance.scope.off();
		const update = instance.update = effect.run.bind(effect);
		const job = instance.job = effect.runIfDirty.bind(effect);
		job.i = instance;
		job.id = instance.uid;
		effect.scheduler = () => queueJob(job);
		toggleRecurse(instance, true);
		update();
	};
	const updateComponentPreRender = (instance, nextVNode, optimized) => {
		nextVNode.component = instance;
		const prevProps = instance.vnode.props;
		instance.vnode = nextVNode;
		instance.next = null;
		updateProps(instance, nextVNode.props, prevProps, optimized);
		updateSlots(instance, nextVNode.children, optimized);
		pauseTracking();
		flushPreFlushCbs(instance);
		resetTracking();
	};
	const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
		const c1 = n1 && n1.children;
		const prevShapeFlag = n1 ? n1.shapeFlag : 0;
		const c2 = n2.children;
		const { patchFlag, shapeFlag } = n2;
		if (patchFlag > 0) {
			if (patchFlag & 128) {
				patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				return;
			} else if (patchFlag & 256) {
				patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				return;
			}
		}
		if (shapeFlag & 8) {
			if (prevShapeFlag & 16) unmountChildren(c1, parentComponent, parentSuspense);
			if (c2 !== c1) hostSetElementText(container, c2);
		} else if (prevShapeFlag & 16) {
			if (shapeFlag & 16) patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else unmountChildren(c1, parentComponent, parentSuspense, true);
		} else {
			if (prevShapeFlag & 8) hostSetElementText(container, "");
			if (shapeFlag & 16) mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
	};
	const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		c1 = c1 || EMPTY_ARR;
		c2 = c2 || EMPTY_ARR;
		const oldLength = c1.length;
		const newLength = c2.length;
		const commonLength = Math.min(oldLength, newLength);
		let i = 0;
		for (; i < commonLength; i++) {
			const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
			patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
		}
		if (oldLength > newLength) unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
		else mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, commonLength);
	};
	const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
		let i = 0;
		const l2 = c2.length;
		let e1 = c1.length - 1;
		let e2 = l2 - 1;
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
			if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else break;
			i++;
		}
		while (i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
			if (isSameVNodeType(n1, n2)) patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
			else break;
			e1--;
			e2--;
		}
		if (i > e1) {
			if (i <= e2) {
				const nextPos = e2 + 1;
				const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
				while (i <= e2) {
					patch(null, c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]), container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					i++;
				}
			}
		} else if (i > e2) while (i <= e1) {
			unmount(c1[i], parentComponent, parentSuspense, true);
			i++;
		}
		else {
			const s1 = i;
			const s2 = i;
			const keyToNewIndexMap = /* @__PURE__ */ new Map();
			for (i = s2; i <= e2; i++) {
				const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
				if (nextChild.key != null) keyToNewIndexMap.set(nextChild.key, i);
			}
			let j;
			let patched = 0;
			const toBePatched = e2 - s2 + 1;
			let moved = false;
			let maxNewIndexSoFar = 0;
			const newIndexToOldIndexMap = new Array(toBePatched);
			for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
			for (i = s1; i <= e1; i++) {
				const prevChild = c1[i];
				if (patched >= toBePatched) {
					unmount(prevChild, parentComponent, parentSuspense, true);
					continue;
				}
				let newIndex;
				if (prevChild.key != null) newIndex = keyToNewIndexMap.get(prevChild.key);
				else for (j = s2; j <= e2; j++) if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
					newIndex = j;
					break;
				}
				if (newIndex === void 0) unmount(prevChild, parentComponent, parentSuspense, true);
				else {
					newIndexToOldIndexMap[newIndex - s2] = i + 1;
					if (newIndex >= maxNewIndexSoFar) maxNewIndexSoFar = newIndex;
					else moved = true;
					patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
					patched++;
				}
			}
			const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
			j = increasingNewIndexSequence.length - 1;
			for (i = toBePatched - 1; i >= 0; i--) {
				const nextIndex = s2 + i;
				const nextChild = c2[nextIndex];
				const anchorVNode = c2[nextIndex + 1];
				const anchor = nextIndex + 1 < l2 ? anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode) : parentAnchor;
				if (newIndexToOldIndexMap[i] === 0) patch(null, nextChild, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
				else if (moved) {
					if (j < 0 || i !== increasingNewIndexSequence[j]) move(nextChild, container, anchor, 2);
					else j--;
				}
			}
		}
	};
	const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
		const { el, type, transition, children, shapeFlag } = vnode;
		if (shapeFlag & 6) {
			move(vnode.component.subTree, container, anchor, moveType);
			return;
		}
		if (shapeFlag & 128) {
			vnode.suspense.move(container, anchor, moveType);
			return;
		}
		if (shapeFlag & 64) {
			type.move(vnode, container, anchor, internals);
			return;
		}
		if (type === Fragment) {
			hostInsert(el, container, anchor);
			for (let i = 0; i < children.length; i++) move(children[i], container, anchor, moveType);
			hostInsert(vnode.anchor, container, anchor);
			return;
		}
		if (type === Static) {
			moveStaticNode(vnode, container, anchor);
			return;
		}
		if (moveType !== 2 && shapeFlag & 1 && transition) {
			if (moveType === 0) {
				if (transition.persisted && !el[leaveCbKey]) hostInsert(el, container, anchor);
				else {
					transition.beforeEnter(el);
					hostInsert(el, container, anchor);
					queuePostRenderEffect(() => transition.enter(el), parentSuspense);
				}
			} else {
				const { leave, delayLeave, afterLeave } = transition;
				const remove2 = () => {
					if (vnode.ctx.isUnmounted) hostRemove(el);
					else hostInsert(el, container, anchor);
				};
				const performLeave = () => {
					const wasLeaving = el._isLeaving || !!el[leaveCbKey];
					if (el._isLeaving) el[leaveCbKey](true);
					if (transition.persisted && !wasLeaving) remove2();
					else leave(el, () => {
						remove2();
						afterLeave && afterLeave();
					});
				};
				if (delayLeave) delayLeave(el, remove2, performLeave);
				else performLeave();
			}
		} else hostInsert(el, container, anchor);
	};
	const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
		const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs, cacheIndex, memo } = vnode;
		if (patchFlag === -2 || dynamicChildren && dynamicChildren.hasOnce) optimized = false;
		if (ref != null) {
			pauseTracking();
			setRef(ref, null, parentSuspense, vnode, true);
			resetTracking();
		}
		if (cacheIndex != null && (!vnode.ctx || vnode.ctx === parentComponent)) parentComponent.renderCache[cacheIndex] = void 0;
		if (shapeFlag & 256 && parentComponent.ctx.deactivate(vnode)) return;
		const shouldInvokeDirs = shapeFlag & 1 && dirs;
		const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
		let vnodeHook;
		if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) invokeVNodeHook(vnodeHook, parentComponent, vnode);
		if (shapeFlag & 6) unmountComponent(vnode.component, parentSuspense, doRemove);
		else {
			if (shapeFlag & 128) {
				vnode.suspense.unmount(parentSuspense, doRemove);
				return;
			}
			if (shouldInvokeDirs) invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
			if (shapeFlag & 64) vnode.type.remove(vnode, parentComponent, parentSuspense, internals, doRemove);
			else if (dynamicChildren && !dynamicChildren.hasOnce && (type !== Fragment || patchFlag > 0 && patchFlag & 64)) unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
			else if (type === Fragment && patchFlag & 384 || !optimized && shapeFlag & 16) unmountChildren(children, parentComponent, parentSuspense);
			if (doRemove) remove(vnode);
		}
		const shouldInvalidateMemo = memo != null && cacheIndex == null;
		if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) queuePostRenderEffect(() => {
			vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
			shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
			if (shouldInvalidateMemo) vnode.el = null;
		}, parentSuspense);
	};
	const remove = (vnode) => {
		const { type, el, anchor, transition } = vnode;
		const isFragment = type === Fragment;
		if (isFragment && !transition) {
			removeFragment(el, anchor);
			return;
		}
		if (type === Static) {
			removeStaticNode(vnode);
			if (transition && !transition.persisted && transition.afterLeave) transition.afterLeave();
			return;
		}
		const leavingNode = isFragment ? getTransitionRoot(vnode) : vnode;
		const performRemove = () => {
			if (isFragment) {
				if (hostParentNode(el)) removeFragment(el, anchor);
			} else hostRemove(el);
			if (transition && !transition.persisted && transition.afterLeave) transition.afterLeave();
		};
		if (leavingNode && leavingNode.shapeFlag & 1 && transition && !transition.persisted) {
			const { leave, delayLeave } = transition;
			const leavingEl = leavingNode.el;
			const performLeave = () => leave(leavingEl, performRemove);
			if (delayLeave) delayLeave(leavingEl, performRemove, performLeave);
			else performLeave();
		} else performRemove();
	};
	const removeFragment = (cur, end) => {
		let next;
		while (cur !== end) {
			next = hostNextSibling(cur);
			hostRemove(cur);
			cur = next;
		}
		hostRemove(end);
	};
	const unmountComponent = (instance, parentSuspense, doRemove) => {
		const { bum, scope, job, subTree, um, m, a } = instance;
		invalidateMount(m);
		invalidateMount(a);
		if (bum) invokeArrayFns(bum);
		scope.stop();
		if (job) {
			job.flags |= 8;
			unmount(subTree, instance, parentSuspense, doRemove);
		} else if (subTree) {
			subTree.transition = instance.vnode.transition;
			unmount(subTree, instance, parentSuspense, doRemove);
		}
		if (um) queuePostRenderEffect(um, parentSuspense);
		const markUnmounted = () => {
			instance.isUnmounted = true;
		};
		markUnmounted.flags = 16;
		queuePostRenderEffect(markUnmounted, parentSuspense);
	};
	const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
		for (let i = start; i < children.length; i++) unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
	};
	const getNextHostNode = (vnode) => {
		if (vnode.shapeFlag & 6) return getNextHostNode(vnode.component.subTree);
		if (vnode.shapeFlag & 128) return vnode.suspense.next();
		const el = hostNextSibling(vnode.anchor || vnode.el);
		const teleportEnd = el && el[TeleportEndKey];
		return teleportEnd ? hostNextSibling(teleportEnd) : el;
	};
	const render = (vnode, container, namespace) => {
		flushOnAppMount(() => {
			if (vnode == null) {
				if (container._vnode) unmount(container._vnode, null, null, true);
			} else patch(container._vnode || null, vnode, container, null, null, null, namespace);
			container._vnode = vnode;
		}, vnode && container._vnode ? void 0 : vnode && vnode.component ? vnode.component.uid : getNextUid());
	};
	const internals = {
		p: patch,
		um: unmount,
		m: move,
		r: remove,
		mt: mountComponent,
		mc: mountChildren,
		pc: patchChildren,
		pbc: patchBlockChildren,
		n: getNextHostNode,
		o: options
	};
	let hydrate;
	let hydrateNode;
	if (createHydrationFns) [hydrate, hydrateNode] = createHydrationFns(internals);
	return {
		render,
		hydrate,
		createApp: createAppAPI(render, hydrate)
	};
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
	return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect, job }, allowed) {
	if (allowed) {
		effect.flags |= 32;
		job.flags |= 4;
	} else {
		effect.flags &= -33;
		job.flags &= -5;
	}
}
function needTransition(parentSuspense, transition) {
	return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
	const ch1 = n1.children;
	const ch2 = n2.children;
	if (isArray(ch1) && isArray(ch2)) for (let i = 0; i < ch1.length; i++) {
		const c1 = ch1[i];
		let c2 = ch2[i];
		if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
			if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
				c2 = ch2[i] = cloneIfMounted(ch2[i]);
				c2.el = c1.el;
			}
			if (!shallow && c2.patchFlag !== -2) traverseStaticChildren(c1, c2);
		}
		if (c2.type === Text) {
			if (c2.patchFlag === -1) c2 = ch2[i] = cloneIfMounted(c2);
			c2.el = c1.el;
		}
		if (c2.type === Comment && !c2.el) c2.el = c1.el;
	}
}
function getSequence(arr) {
	const p = arr.slice();
	const result = [0];
	let i, j, u, v, c;
	const len = arr.length;
	for (i = 0; i < len; i++) {
		const arrI = arr[i];
		if (arrI !== 0) {
			j = result[result.length - 1];
			if (arr[j] < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = u + v >> 1;
				if (arr[result[c]] < arrI) u = c + 1;
				else v = c;
			}
			if (arrI < arr[result[u]]) {
				if (u > 0) p[i] = result[u - 1];
				result[u] = i;
			}
		}
	}
	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}
function locateUnresolvedAsyncRoot(instance) {
	const subComponent = instance.subTree.component;
	if (subComponent) {
		if (subComponent.asyncDep && !subComponent.asyncResolved) return subComponent;
		else return locateUnresolvedAsyncRoot(subComponent);
	}
}
function invalidateMount(hooks) {
	if (hooks) for (let i = 0; i < hooks.length; i++) hooks[i].flags |= 8;
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
	if (anchorVnode.placeholder) return anchorVnode.placeholder;
	const instance = anchorVnode.component;
	if (instance) return resolveAsyncComponentPlaceholder(instance.subTree);
	const suspense = anchorVnode.suspense;
	if (suspense && suspense.activeBranch) return resolveAsyncComponentPlaceholder(suspense.activeBranch);
	return null;
}
var isSuspense = (type) => type.__isSuspense;
var deferredEnterKey = /* @__PURE__ */ Symbol("_deferredEnter");
function queueEffectWithSuspense(fn, suspense) {
	if (suspense && suspense.pendingBranch) {
		if (isArray(fn)) suspense.effects.push(...fn);
		else suspense.effects.push(fn);
	} else queuePostFlushCb(fn);
}
var Fragment = /* @__PURE__ */ Symbol.for("v-fgt");
var Text = /* @__PURE__ */ Symbol.for("v-txt");
var Comment = /* @__PURE__ */ Symbol.for("v-cmt");
var Static = /* @__PURE__ */ Symbol.for("v-stc");
var blockStack = [];
var currentBlock = null;
function openBlock(disableTracking = false) {
	blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
	blockStack.pop();
	currentBlock = blockStack[blockStack.length - 1] || null;
}
var isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
	isBlockTreeEnabled += value;
	if (value < 0 && currentBlock && inVOnce) currentBlock.hasOnce = true;
}
function setupBlock(vnode) {
	vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
	closeBlock();
	if (isBlockTreeEnabled > 0 && currentBlock) currentBlock.push(vnode);
	return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
	return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
	return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
}
function isVNode(value) {
	return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
	return n1.type === n2.type && n1.key === n2.key;
}
var normalizeKey = ({ key }) => key != null ? key : null;
var normalizeRef = ({ ref, ref_key, ref_for }) => {
	if (typeof ref === "number") ref = "" + ref;
	return ref != null ? isString(ref) || /* @__PURE__ */ isRef(ref) || isFunction(ref) ? {
		i: currentRenderingInstance,
		r: ref,
		k: ref_key,
		f: !!ref_for
	} : ref : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
	const vnode = {
		__v_isVNode: true,
		__v_skip: true,
		type,
		props,
		key: props && normalizeKey(props),
		ref: props && normalizeRef(props),
		scopeId: currentScopeId,
		slotScopeIds: null,
		children,
		component: null,
		suspense: null,
		ssContent: null,
		ssFallback: null,
		dirs: null,
		transition: null,
		el: null,
		anchor: null,
		target: null,
		targetStart: null,
		targetAnchor: null,
		staticCount: 0,
		shapeFlag,
		patchFlag,
		dynamicProps,
		dynamicChildren: null,
		appContext: null,
		ctx: currentRenderingInstance
	};
	if (needFullChildrenNormalization) {
		normalizeChildren(vnode, children);
		if (shapeFlag & 128) type.normalize(vnode);
	} else if (children) vnode.shapeFlag |= isString(children) ? 8 : 16;
	if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock && (vnode.patchFlag > 0 || shapeFlag & 6) && vnode.patchFlag !== 32) currentBlock.push(vnode);
	return vnode;
}
var createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
	if (!type || type === NULL_DYNAMIC_COMPONENT) type = Comment;
	if (isVNode(type)) {
		const cloned = cloneVNode(type, props, true);
		if (children) normalizeChildren(cloned, children);
		if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
			if (cloned.shapeFlag & 6) currentBlock[currentBlock.indexOf(type)] = cloned;
			else currentBlock.push(cloned);
		}
		cloned.patchFlag = -2;
		return cloned;
	}
	if (isClassComponent(type)) type = type.__vccOpts;
	if (props) {
		props = guardReactiveProps(props);
		let { class: klass, style } = props;
		if (klass && !isString(klass)) props.class = normalizeClass(klass);
		if (isObject(style)) {
			if (/* @__PURE__ */ isProxy(style) && !isArray(style)) style = extend({}, style);
			props.style = normalizeStyle(style);
		}
	}
	const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
	return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
}
function guardReactiveProps(props) {
	if (!props) return null;
	if (/* @__PURE__ */ isProxy(props)) return extend({}, props);
	return isInternalObject(props) ? extend({}, props[rawAttrsKey] || props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
	const { props, ref, patchFlag, children, transition } = vnode;
	const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
	const cloned = {
		__v_isVNode: true,
		__v_skip: true,
		type: vnode.type,
		props: mergedProps,
		key: mergedProps && normalizeKey(mergedProps),
		ref: extraProps && extraProps.ref ? mergeRef && ref ? isArray(ref) ? ref.concat(normalizeRef(extraProps)) : [ref, normalizeRef(extraProps)] : normalizeRef(extraProps) : ref,
		scopeId: vnode.scopeId,
		slotScopeIds: vnode.slotScopeIds,
		children,
		target: vnode.target,
		targetStart: vnode.targetStart,
		targetAnchor: vnode.targetAnchor,
		staticCount: vnode.staticCount,
		shapeFlag: vnode.shapeFlag,
		patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
		dynamicProps: vnode.dynamicProps,
		dynamicChildren: vnode.dynamicChildren,
		appContext: vnode.appContext,
		dirs: vnode.dirs,
		transition,
		component: vnode.component,
		suspense: vnode.suspense,
		ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
		ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
		placeholder: vnode.placeholder,
		el: vnode.el,
		anchor: vnode.anchor,
		ctx: vnode.ctx,
		ce: vnode.ce,
		cacheIndex: vnode.cacheIndex
	};
	if (transition && cloneTransition) setTransitionHooks(cloned, transition.clone(cloned));
	return cloned;
}
function createTextVNode(text = " ", flag = 0) {
	return createVNode(Text, null, text, flag);
}
function createStaticVNode(content, numberOfNodes) {
	const vnode = createVNode(Static, null, content);
	vnode.staticCount = numberOfNodes;
	return vnode;
}
function createCommentVNode(text = "", asBlock = false) {
	return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
	if (child == null || typeof child === "boolean") return createVNode(Comment);
	else if (isArray(child)) return createVNode(Fragment, null, child.slice());
	else if (isVNode(child)) return cloneIfMounted(child);
	else return createVNode(Text, null, String(child));
}
function cloneIfMounted(child) {
	return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
	let type = 0;
	const { shapeFlag } = vnode;
	if (children == null) children = null;
	else if (isArray(children)) type = 16;
	else if (typeof children === "object") {
		if (shapeFlag & 65) {
			const slot = children.default;
			if (slot) {
				slot._c && (slot._d = false);
				normalizeChildren(vnode, slot());
				slot._c && (slot._d = true);
			}
			return;
		} else {
			type = 32;
			const slotFlag = children._;
			if (!slotFlag && !isInternalObject(children)) children._ctx = currentRenderingInstance;
			else if (slotFlag === 3 && currentRenderingInstance) {
				if (currentRenderingInstance.slots._ === 1) children._ = 1;
				else {
					children._ = 2;
					vnode.patchFlag |= 1024;
				}
			}
		}
	} else if (isFunction(children)) {
		if (shapeFlag & 65) {
			normalizeChildren(vnode, { default: children });
			return;
		}
		children = {
			default: children,
			_ctx: currentRenderingInstance
		};
		type = 32;
	} else {
		children = String(children);
		if (shapeFlag & 64) {
			type = 16;
			children = [createTextVNode(children)];
		} else type = 8;
	}
	vnode.children = children;
	vnode.shapeFlag |= type;
}
function mergeProps(...args) {
	const ret = {};
	for (let i = 0; i < args.length; i++) {
		const toMerge = args[i];
		for (const key in toMerge) if (key === "class") {
			if (ret.class !== toMerge.class) ret.class = normalizeClass([ret.class, toMerge.class]);
		} else if (key === "style") ret.style = normalizeStyle([ret.style, toMerge.style]);
		else if (isOn(key)) {
			const existing = ret[key];
			const incoming = toMerge[key];
			if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) ret[key] = existing ? [].concat(existing, incoming) : incoming;
			else if (incoming == null && existing == null && !isModelListener(key)) ret[key] = incoming;
		} else if (key !== "") ret[key] = toMerge[key];
	}
	return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
	callWithAsyncErrorHandling(hook, instance, 7, [vnode, prevVNode]);
}
var emptyAppContext = /* @__PURE__ */ createAppContext();
var uid = 0;
function getNextUid() {
	return uid;
}
function createComponentInstance(vnode, parent, suspense) {
	const type = vnode.type;
	const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
	const instance = {
		uid: uid++,
		vnode,
		type,
		parent,
		appContext,
		root: null,
		next: null,
		subTree: null,
		effect: null,
		update: null,
		job: null,
		scope: new EffectScope(true),
		render: null,
		proxy: null,
		exposed: null,
		exposeProxy: null,
		withProxy: null,
		provides: parent ? parent.provides : Object.create(appContext.provides),
		ids: parent ? parent.ids : [
			"",
			0,
			0
		],
		accessCache: null,
		renderCache: [],
		components: null,
		directives: null,
		propsOptions: normalizePropsOptions(type, appContext),
		emitsOptions: normalizeEmitsOptions(type, appContext),
		emit: null,
		emitted: null,
		propsDefaults: EMPTY_OBJ,
		inheritAttrs: type.inheritAttrs,
		ctx: EMPTY_OBJ,
		data: EMPTY_OBJ,
		props: EMPTY_OBJ,
		attrs: EMPTY_OBJ,
		slots: EMPTY_OBJ,
		refs: EMPTY_OBJ,
		setupState: EMPTY_OBJ,
		setupContext: null,
		suspense,
		suspenseId: suspense ? suspense.pendingId : 0,
		asyncDep: null,
		asyncResolved: false,
		isMounted: false,
		isUnmounted: false,
		isDeactivated: false,
		bc: null,
		c: null,
		bm: null,
		m: null,
		bu: null,
		u: null,
		um: null,
		bum: null,
		da: null,
		a: null,
		rtg: null,
		rtc: null,
		ec: null,
		sp: null
	};
	instance.ctx = { _: instance };
	instance.root = parent ? parent.root : instance;
	instance.emit = emit.bind(null, instance);
	if (vnode.ce) vnode.ce(instance);
	return instance;
}
var currentInstance = null;
var getCurrentInstance = () => currentInstance || currentRenderingInstance;
var internalSetCurrentInstance;
var setInSSRSetupState;
{
	const g = getGlobalThis();
	const registerGlobalSetter = (key, setter) => {
		let setters;
		if (!(setters = g[key])) setters = g[key] = [];
		setters.push(setter);
		return (v) => {
			if (setters.length > 1) setters.forEach((set) => set(v));
			else setters[0](v);
		};
	};
	internalSetCurrentInstance = registerGlobalSetter(`__VUE_INSTANCE_SETTERS__`, (v) => currentInstance = v);
	setInSSRSetupState = registerGlobalSetter(`__VUE_SSR_SETTERS__`, (v) => isInSSRComponentSetup = v);
}
var setCurrentInstance = (instance) => {
	const prev = currentInstance;
	internalSetCurrentInstance(instance);
	instance.scope.on();
	return () => {
		instance.scope.off();
		internalSetCurrentInstance(prev);
	};
};
var unsetCurrentInstance = () => {
	currentInstance && currentInstance.scope.off();
	internalSetCurrentInstance(null);
};
function isStatefulComponent(instance) {
	return instance.vnode.shapeFlag & 4;
}
var isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false, optimized = false) {
	isSSR && setInSSRSetupState(isSSR);
	const { props, children } = instance.vnode;
	const isStateful = isStatefulComponent(instance);
	initProps(instance, props, isStateful, isSSR);
	initSlots(instance, children, optimized || isSSR);
	const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
	isSSR && setInSSRSetupState(false);
	return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
	const Component = instance.type;
	instance.accessCache = /* @__PURE__ */ Object.create(null);
	instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
	const { setup } = Component;
	if (setup) {
		pauseTracking();
		const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
		const reset = setCurrentInstance(instance);
		const setupResult = callWithErrorHandling(setup, instance, 0, [instance.props, setupContext]);
		const isAsyncSetup = isPromise(setupResult);
		resetTracking();
		reset();
		if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) markAsyncBoundary(instance);
		if (isAsyncSetup) {
			setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
			if (isSSR) return setupResult.then((resolvedResult) => {
				setInSSRSetupState(true);
				try {
					handleSetupResult(instance, resolvedResult, isSSR);
				} finally {
					setInSSRSetupState(false);
				}
			}).catch((e) => {
				handleError(e, instance, 0, void 0, true);
				instance.ssrRender = (_, push) => push("<!---->");
			});
			else instance.asyncDep = setupResult;
		} else handleSetupResult(instance, setupResult, isSSR);
	} else finishComponentSetup(instance, isSSR);
}
function handleSetupResult(instance, setupResult, isSSR) {
	if (isFunction(setupResult)) {
		if (instance.type.__ssrInlineRender) instance.ssrRender = setupResult;
		else instance.render = setupResult;
	} else if (isObject(setupResult)) instance.setupState = proxyRefs(setupResult);
	finishComponentSetup(instance, isSSR);
}
function finishComponentSetup(instance, isSSR, skipOptions) {
	const Component = instance.type;
	if (!instance.render) instance.render = Component.render || NOOP;
}
var rawAttrsKey = /* @__PURE__ */ Symbol();
var attrsProxyHandlers = { get(target, key) {
	track(target, "get", "");
	return key === rawAttrsKey ? target : target[key];
} };
function createSetupContext(instance) {
	const expose = (exposed) => {
		instance.exposed = exposed || {};
	};
	return {
		attrs: new Proxy(instance.attrs, attrsProxyHandlers),
		slots: instance.slots,
		emit: instance.emit,
		expose
	};
}
function getComponentPublicInstance(instance) {
	if (instance.exposed) return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
		get(target, key) {
			if (key in target) return target[key];
			else if (key in publicPropertiesMap) return publicPropertiesMap[key](instance);
		},
		has(target, key) {
			return key in target || key in publicPropertiesMap;
		}
	}));
	else return instance.proxy;
}
function getComponentName(Component, includeInferred = true) {
	return isFunction(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
}
function isClassComponent(value) {
	return isFunction(value) && "__vccOpts" in value;
}
var computed = (getterOrOptions, debugOptions) => {
	return /* @__PURE__ */ computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
};
var version = "3.5.45";
// node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js
/**
* @vue/runtime-dom v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var policy = void 0;
var tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) try {
	policy = /* @__PURE__ */ tt.createPolicy("vue", { createHTML: (val) => val });
} catch (e) {}
var unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
var svgNS = "http://www.w3.org/2000/svg";
var mathmlNS = "http://www.w3.org/1998/Math/MathML";
var doc = typeof document !== "undefined" ? document : null;
var templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
var nodeOps = {
	insert: (child, parent, anchor) => {
		parent.insertBefore(child, anchor || null);
	},
	remove: (child) => {
		const parent = child.parentNode;
		if (parent) parent.removeChild(child);
	},
	createElement: (tag, namespace, is, props) => {
		const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
		if (tag === "select" && props && props.multiple != null) el.setAttribute("multiple", props.multiple);
		return el;
	},
	createText: (text) => doc.createTextNode(text),
	createComment: (text) => doc.createComment(text),
	setText: (node, text) => {
		node.nodeValue = text;
	},
	setElementText: (el, text) => {
		el.textContent = text;
	},
	parentNode: (node) => node.parentNode,
	nextSibling: (node) => node.nextSibling,
	querySelector: (selector) => doc.querySelector(selector),
	setScopeId(el, id) {
		el.setAttribute(id, "");
	},
	insertStaticContent(content, parent, anchor, namespace, start, end) {
		const before = anchor ? anchor.previousSibling : parent.lastChild;
		if (start && (start === end || start.nextSibling)) while (true) {
			parent.insertBefore(start.cloneNode(true), anchor);
			if (start === end || !(start = start.nextSibling)) break;
		}
		else {
			templateContainer.innerHTML = unsafeToTrustedHTML(namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content);
			const template = templateContainer.content;
			if (namespace === "svg" || namespace === "mathml") {
				const wrapper = template.firstChild;
				while (wrapper.firstChild) template.appendChild(wrapper.firstChild);
				template.removeChild(wrapper);
			}
			parent.insertBefore(template, anchor);
		}
		return [before ? before.nextSibling : parent.firstChild, anchor ? anchor.previousSibling : parent.lastChild];
	}
};
var vtcKey = /* @__PURE__ */ Symbol("_vtc");
function patchClass(el, value, isSVG) {
	const transitionClasses = el[vtcKey];
	if (transitionClasses) value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
	if (value == null) el.removeAttribute("class");
	else if (isSVG) el.setAttribute("class", value);
	else el.className = value;
}
var vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
var vShowHidden = /* @__PURE__ */ Symbol("_vsh");
var vShow = {
	name: "show",
	beforeMount(el, { value }, { transition }) {
		el[vShowOriginalDisplay] = el.style.display === "none" ? "" : el.style.display;
		if (transition && value) transition.beforeEnter(el);
		else setDisplay(el, value);
	},
	mounted(el, { value }, { transition }) {
		if (transition && value) transition.enter(el);
	},
	updated(el, { value, oldValue }, { transition }) {
		if (!value === !oldValue) return;
		if (transition) {
			if (value) {
				transition.beforeEnter(el);
				setDisplay(el, true);
				transition.enter(el);
			} else transition.leave(el, () => {
				setDisplay(el, false);
			});
		} else setDisplay(el, value);
	},
	beforeUnmount(el, { value }) {
		setDisplay(el, value);
	}
};
function setDisplay(el, value) {
	el.style.display = value ? el[vShowOriginalDisplay] : "none";
	el[vShowHidden] = !value;
}
var CSS_VAR_TEXT = /* @__PURE__ */ Symbol("");
var displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
	const style = el.style;
	const isCssString = isString(next);
	let hasControlledDisplay = false;
	if (next && !isCssString) {
		if (prev) {
			if (!isString(prev)) {
				for (const key in prev) if (next[key] == null) setStyle(style, key, "");
			} else for (const prevStyle of prev.split(";")) {
				const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
				if (next[key] == null) setStyle(style, key, "");
			}
		}
		for (const key in next) {
			if (key === "display") hasControlledDisplay = true;
			const value = next[key];
			if (value != null) {
				if (!shouldPreserveTextareaResizeStyle(el, key, !isString(prev) && prev ? prev[key] : void 0, value)) setStyle(style, key, value);
			} else setStyle(style, key, "");
		}
	} else if (isCssString) {
		if (prev !== next) {
			const cssVarText = style[CSS_VAR_TEXT];
			if (cssVarText) next += ";" + cssVarText;
			style.cssText = next;
			hasControlledDisplay = displayRE.test(next);
		}
	} else if (prev) el.removeAttribute("style");
	if (vShowOriginalDisplay in el) {
		if (!isCssString || prev !== next) el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
		if (el[vShowHidden]) style.display = "none";
	}
}
var importantRE = /\s*!important$/;
function setStyle(style, name, val) {
	if (isArray(val)) val.forEach((v) => setStyle(style, name, v));
	else {
		if (val == null) val = "";
		if (name.startsWith("--")) {
			if (importantRE.test(val)) style.setProperty(name, val.replace(importantRE, ""), "important");
			else style.setProperty(name, val);
		} else {
			const prefixed = autoPrefix(style, name);
			if (importantRE.test(val)) style.setProperty(hyphenate(prefixed), val.replace(importantRE, ""), "important");
			else style[prefixed] = val;
		}
	}
}
var prefixes = [
	"Webkit",
	"Moz",
	"ms"
];
var prefixCache = {};
function autoPrefix(style, rawName) {
	const cached = prefixCache[rawName];
	if (cached) return cached;
	let name = camelize(rawName);
	if (name !== "filter" && name in style) return prefixCache[rawName] = name;
	name = capitalize(name);
	for (let i = 0; i < prefixes.length; i++) {
		const prefixed = prefixes[i] + name;
		if (prefixed in style) return prefixCache[rawName] = prefixed;
	}
	return rawName;
}
function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
	return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && isString(next) && prev === next;
}
var xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
	if (isSVG && key.startsWith("xlink:")) {
		if (value == null) el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
		else el.setAttributeNS(xlinkNS, key, value);
	} else if (value == null || isBoolean && !includeBooleanAttr(value)) el.removeAttribute(key);
	else el.setAttribute(key, isBoolean ? "" : isSymbol(value) ? String(value) : value);
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
	if (key === "innerHTML" || key === "textContent") {
		if (value != null) el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
		return;
	}
	const tag = el.tagName;
	if (key === "value" && tag !== "PROGRESS" && !tag.includes("-")) {
		const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
		const newValue = value == null ? el.type === "checkbox" ? "on" : "" : String(value);
		if (oldValue !== newValue || !("_value" in el)) el.value = newValue;
		if (value == null) el.removeAttribute(key);
		el._value = value;
		return;
	}
	let needRemove = false;
	if (value === "" || value == null) {
		const type = typeof el[key];
		if (type === "boolean") value = includeBooleanAttr(value);
		else if (value == null && type === "string") {
			value = "";
			needRemove = true;
		} else if (type === "number") {
			value = 0;
			needRemove = true;
		}
	}
	try {
		el[key] = value;
	} catch (e) {}
	needRemove && el.removeAttribute(attrName || key);
}
function addEventListener$1(el, event, handler, options) {
	el.addEventListener(event, handler, options);
}
function removeEventListener$1(el, event, handler, options) {
	el.removeEventListener(event, handler, options);
}
var veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
	const invokers = el[veiKey] || (el[veiKey] = {});
	const existingInvoker = invokers[rawName];
	if (nextValue && existingInvoker) existingInvoker.value = nextValue;
	else {
		const [name, options] = parseName(rawName);
		if (nextValue) addEventListener$1(el, name, invokers[rawName] = createInvoker(nextValue, instance), options);
		else if (existingInvoker) {
			removeEventListener$1(el, name, existingInvoker, options);
			invokers[rawName] = void 0;
		}
	}
}
var optionsModifierRE = /(Once|Passive|Capture)$/;
var optionsModifierEventRE = /^on:?(?:Once|Passive|Capture)$/;
function parseName(name) {
	let options;
	let m;
	while ((m = name.match(optionsModifierRE)) && !optionsModifierEventRE.test(name)) {
		if (!options) options = {};
		name = name.slice(0, name.length - m[1].length);
		options[m[1].toLowerCase()] = true;
	}
	return [name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2)), options];
}
var cachedNow = 0;
var p = /* @__PURE__ */ Promise.resolve();
var getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
	const invoker = (e) => {
		if (!e._vts) e._vts = Date.now();
		else if (e._vts <= invoker.attached) return;
		const value = invoker.value;
		if (isArray(value)) {
			const originalStop = e.stopImmediatePropagation;
			e.stopImmediatePropagation = () => {
				originalStop.call(e);
				e._stopped = true;
			};
			const handlers = value.slice();
			const args = [e];
			for (let i = 0; i < handlers.length; i++) {
				if (e._stopped) break;
				const handler = handlers[i];
				if (handler) callWithAsyncErrorHandling(handler, instance, 5, args);
			}
		} else callWithAsyncErrorHandling(value, instance, 5, [e]);
	};
	invoker.value = initialValue;
	invoker.attached = getNow();
	return invoker;
}
var isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
var patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
	const isSVG = namespace === "svg";
	if (key === "class") patchClass(el, nextValue, isSVG);
	else if (key === "style") patchStyle(el, prevValue, nextValue);
	else if (isOn(key)) {
		if (!isModelListener(key)) patchEvent(el, key, prevValue, nextValue, parentComponent);
	} else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
		patchDOMProp(el, key, nextValue);
		if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
	} else if (el._isVueCE && (shouldSetAsPropForVueCE(el, key) || el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString(nextValue)))) patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
	else {
		if (key === "true-value") el._trueValue = nextValue;
		else if (key === "false-value") el._falseValue = nextValue;
		patchAttr(el, key, nextValue, isSVG);
	}
};
function shouldSetAsProp(el, key, value, isSVG) {
	if (isSVG) {
		if (key === "innerHTML" || key === "textContent") return true;
		if (key in el && isNativeOn(key) && isFunction(value)) return true;
		return false;
	}
	if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") return false;
	if (key === "sandbox" && el.tagName === "IFRAME") return false;
	if (key === "form") return false;
	if (key === "list" && el.tagName === "INPUT") return false;
	if (key === "type" && el.tagName === "TEXTAREA") return false;
	if (key === "width" || key === "height") {
		const tag = el.tagName;
		if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") return false;
	}
	if (isNativeOn(key) && isString(value)) return false;
	return key in el;
}
function shouldSetAsPropForVueCE(el, key) {
	const props = el._def.props;
	if (!props) return false;
	const camelKey = camelize(key);
	return Array.isArray(props) ? props.some((prop) => camelize(prop) === camelKey) : Object.keys(props).some((prop) => camelize(prop) === camelKey);
}
var getModelAssigner = (vnode) => {
	const fn = vnode.props["onUpdate:modelValue"] || false;
	return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
	e.target.composing = true;
}
function onCompositionEnd(e) {
	const target = e.target;
	if (target.composing) {
		target.composing = false;
		target.dispatchEvent(new Event("input"));
	}
}
var assignKey = /* @__PURE__ */ Symbol("_assign");
var initialValueKey = /* @__PURE__ */ Symbol("_initialValue");
function castValue(value, trim, number) {
	if (trim) value = value.trim();
	if (number) value = looseToNumber(value);
	return value;
}
var vModelText = {
	created(el, { modifiers: { lazy, trim, number } }, vnode) {
		if (el.parentNode) {
			if (el.type === "text") el[initialValueKey] = el.defaultValue.replace(/[\r\n]/g, "");
			else if (el.type === "textarea") el[initialValueKey] = el.defaultValue.replace(/\r\n?/g, "\n");
		}
		el[assignKey] = getModelAssigner(vnode);
		const castToNumber = number || vnode.props && vnode.props.type === "number";
		addEventListener$1(el, lazy ? "change" : "input", (e) => {
			if (e.target.composing) return;
			el[assignKey](castValue(el.value, trim, castToNumber));
		});
		if (trim || castToNumber) addEventListener$1(el, "change", () => {
			el.value = castValue(el.value, trim, castToNumber);
		});
		if (!lazy) {
			addEventListener$1(el, "compositionstart", onCompositionStart);
			addEventListener$1(el, "compositionend", onCompositionEnd);
			addEventListener$1(el, "change", onCompositionEnd);
		}
	},
	mounted(el, { value, modifiers: { trim, number } }) {
		const newValue = value == null ? "" : value;
		const initialValue = el[initialValueKey];
		delete el[initialValueKey];
		if (initialValue !== void 0 && (el.type === "text" || el.type === "textarea") && el.value !== initialValue) el[assignKey](castValue(el.value, trim, number));
		else el.value = newValue;
	},
	beforeUpdate(el, { value, oldValue, modifiers: { lazy, trim, number } }, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		if (el.composing) return;
		const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? looseToNumber(el.value) : el.value;
		const newValue = value == null ? "" : value;
		if (elValue === newValue) return;
		const rootNode = el.getRootNode();
		if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement === el && el.type !== "range") {
			if (lazy && value === oldValue) return;
			if (trim && el.value.trim() === newValue) return;
		}
		el.value = newValue;
	}
};
var vModelCheckbox = {
	deep: true,
	created(el, _, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		addEventListener$1(el, "change", () => {
			const modelValue = el._modelValue;
			const elementValue = getValue(el);
			const checked = el.checked;
			const assign = el[assignKey];
			if (isArray(modelValue)) {
				const index = looseIndexOf(modelValue, elementValue);
				const found = index !== -1;
				if (checked && !found) assign(modelValue.concat(elementValue));
				else if (!checked && found) {
					const filtered = [...modelValue];
					filtered.splice(index, 1);
					assign(filtered);
				}
			} else if (isSet(modelValue)) {
				const cloned = new Set(modelValue);
				if (checked) cloned.add(elementValue);
				else cloned.delete(elementValue);
				assign(cloned);
			} else assign(getCheckboxValue(el, checked));
		});
	},
	mounted: setChecked,
	beforeUpdate(el, binding, vnode) {
		el[assignKey] = getModelAssigner(vnode);
		setChecked(el, binding, vnode);
	}
};
function setChecked(el, { value, oldValue }, vnode) {
	el._modelValue = value;
	let checked;
	if (isArray(value)) checked = looseIndexOf(value, vnode.props.value) > -1;
	else if (isSet(value)) checked = value.has(vnode.props.value);
	else {
		if (value === oldValue) return;
		checked = looseEqual(value, getCheckboxValue(el, true));
	}
	if (el.checked !== checked) el.checked = checked;
}
var vModelSelect = {
	deep: true,
	created(el, { value, modifiers: { number } }, vnode) {
		el._modelValue = value;
		addEventListener$1(el, "change", () => {
			const selectedVal = Array.prototype.filter.call(el.options, (o) => o.selected).map((o) => number ? looseToNumber(getValue(o)) : getValue(o));
			const multiple = el.multiple;
			const assignedValue = multiple ? isSet(el._modelValue) ? new Set(selectedVal) : selectedVal : selectedVal[0];
			const pending = el._pendingValue = [multiple, multiple ? isArray(assignedValue) ? selectedVal.slice() : selectedVal : assignedValue];
			try {
				el[assignKey](assignedValue);
			} finally {
				nextTick(() => {
					if (el._pendingValue === pending) el._pendingValue = void 0;
				});
			}
		});
		el[assignKey] = getModelAssigner(vnode);
	},
	mounted(el, { value, modifiers: { number } }) {
		setSelected(el, value, number);
	},
	beforeUpdate(el, { value }, vnode) {
		el._modelValue = value;
		el[assignKey] = getModelAssigner(vnode);
	},
	updated(el, { value, modifiers: { number } }) {
		const pending = el._pendingValue;
		el._pendingValue = void 0;
		if (!pending || pending[0] !== el.multiple || !isSameSelectValue(value, pending[1], pending[0])) setSelected(el, value, number);
	}
};
function isSameSelectValue(value, assignedValue, multiple) {
	if (!multiple) return looseEqual(value, assignedValue);
	if (isArray(value)) return looseEqual(value, assignedValue);
	if (isSet(value)) {
		if (value.size !== assignedValue.length) return false;
		for (const item of assignedValue) if (!value.has(item)) return false;
		return true;
	}
	return false;
}
function setSelected(el, value, number = false) {
	const isMultiple = el.multiple;
	const isArrayValue = isArray(value);
	if (isMultiple && !isArrayValue && !isSet(value)) return;
	for (let i = 0, l = el.options.length; i < l; i++) {
		const option = el.options[i];
		const optionValue = getValue(option);
		if (isMultiple) {
			if (isArrayValue) {
				const optionType = typeof optionValue;
				if (optionType === "string" || optionType === "number") option.selected = value.some((v) => String(v) === String(optionValue));
				else option.selected = looseIndexOf(value, optionValue) > -1;
			} else option.selected = value.has(optionValue) || number && typeof optionValue === "string" && value.has(looseToNumber(optionValue));
		} else if (looseEqual(getValue(option), value)) {
			if (el.selectedIndex !== i) el.selectedIndex = i;
			return;
		}
	}
	if (!isMultiple && el.selectedIndex !== -1) el.selectedIndex = -1;
}
function getValue(el) {
	return "_value" in el ? el._value : el.value;
}
function getCheckboxValue(el, checked) {
	const key = checked ? "_trueValue" : "_falseValue";
	return key in el ? el[key] : checked;
}
var systemModifiers = [
	"ctrl",
	"shift",
	"alt",
	"meta"
];
var modifierGuards = {
	stop: (e) => e.stopPropagation(),
	prevent: (e) => e.preventDefault(),
	self: (e) => e.target !== e.currentTarget,
	ctrl: (e) => !e.ctrlKey,
	shift: (e) => !e.shiftKey,
	alt: (e) => !e.altKey,
	meta: (e) => !e.metaKey,
	left: (e) => "button" in e && e.button !== 0,
	middle: (e) => "button" in e && e.button !== 1,
	right: (e) => "button" in e && e.button !== 2,
	exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
var withModifiers = (fn, modifiers) => {
	if (!fn) return fn;
	const cache = fn._withMods || (fn._withMods = {});
	const cacheKey = modifiers.join(".");
	return cache[cacheKey] || (cache[cacheKey] = ((event, ...args) => {
		for (let i = 0; i < modifiers.length; i++) {
			const guard = modifierGuards[modifiers[i]];
			if (guard && guard(event, modifiers)) return;
		}
		return fn(event, ...args);
	}));
};
var keyNames = {
	esc: "escape",
	space: " ",
	up: "arrow-up",
	left: "arrow-left",
	right: "arrow-right",
	down: "arrow-down",
	delete: "backspace"
};
var withKeys = (fn, modifiers) => {
	const cache = fn._withKeys || (fn._withKeys = {});
	const cacheKey = modifiers.join(".");
	return cache[cacheKey] || (cache[cacheKey] = ((event) => {
		if (!("key" in event)) return;
		const eventKey = hyphenate(event.key);
		if (modifiers.some((k) => k === eventKey || keyNames[k] === eventKey)) return fn(event);
	}));
};
var rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
var renderer;
function ensureRenderer() {
	return renderer || (renderer = createRenderer(rendererOptions));
}
var createApp = ((...args) => {
	const app = ensureRenderer().createApp(...args);
	const { mount } = app;
	app.mount = (containerOrSelector) => {
		const container = normalizeContainer(containerOrSelector);
		if (!container) return;
		const component = app._component;
		if (!isFunction(component) && !component.render && !component.template) component.template = container.innerHTML;
		if (container.nodeType === 1) container.textContent = "";
		const proxy = mount(container, false, resolveRootNamespace(container));
		if (container instanceof Element) {
			container.removeAttribute("v-cloak");
			container.setAttribute("data-v-app", "");
		}
		return proxy;
	};
	return app;
});
function resolveRootNamespace(container) {
	if (container instanceof SVGElement) return "svg";
	if (typeof MathMLElement === "function" && container instanceof MathMLElement) return "mathml";
}
function normalizeContainer(container) {
	if (isString(container)) return document.querySelector(container);
	return container;
}
// src/composables/state.ts
var tabs = [
	"apps",
	"yam",
	"home",
	"diagnostics",
	"updates",
	"backups",
	"chatgpt",
	"overview",
	"player",
	"alarm",
	"charts",
	"boot",
	"files",
	"logs",
	"console",
	"settings",
	"scenes",
	"wakeword"
];
var online = /* @__PURE__ */ ref(false);
var hash = /* @__PURE__ */ ref(location.hash.slice(1));
var route = /* @__PURE__ */ reactive({ active: computed(() => tabs.includes(hash.value) ? hash.value : online.value ? "overview" : "home") });
var direct = /* @__PURE__ */ new Set([
	"apps",
	"yam",
	"home",
	"diagnostics",
	"settings",
	"updates",
	"backups",
	"chatgpt"
]);
function syncRoute() {
	hash.value = location.hash.slice(1);
}
var health = /* @__PURE__ */ reactive({
	info: null,
	error: ""
});
var packages = /* @__PURE__ */ ref([]);
var yamVersion = /* @__PURE__ */ ref("Проверяем…");
// src/device/controls.js
function createDeviceControls(context) {
	const scope = new AbortController(), timers = /* @__PURE__ */ new Set(), intervals = /* @__PURE__ */ new Set(), frames = /* @__PURE__ */ new Set(), observers = /* @__PURE__ */ new Set(), listeners = [];
	const ResizeObserver = class extends window.ResizeObserver {
		constructor(fn) {
			super(fn);
			observers.add(this);
		}
	};
	const setTimeout = (fn, ms, ...args) => {
		const id = window.setTimeout(() => {
			timers.delete(id);
			if (!scope.signal.aborted) fn(...args);
		}, ms);
		timers.add(id);
		return id;
	};
	const setInterval = (fn, ms, ...args) => {
		const id = window.setInterval(() => {
			if (!scope.signal.aborted) fn(...args);
		}, ms);
		intervals.add(id);
		return id;
	};
	const clearTimeout = (id) => {
		timers.delete(id);
		window.clearTimeout(id);
	}, clearInterval = (id) => {
		intervals.delete(id);
		window.clearInterval(id);
	};
	const requestAnimationFrame = (fn) => {
		const id = window.requestAnimationFrame((t) => {
			frames.delete(id);
			if (!scope.signal.aborted) fn(t);
		});
		frames.add(id);
		return id;
	};
	const listen = (target, event, fn, options) => {
		target.addEventListener(event, fn, options);
		listeners.push([
			target,
			event,
			fn,
			options
		]);
	};
	const $ = (s) => document.querySelector(s);
	let online = false;
	const $$ = (s) => [...document.querySelectorAll(s)];
	const icon = (id, size = 16) => `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#${id}"/></svg>`;
	function toast(msg, err = false) {
		const t = $("#toast");
		t.textContent = msg;
		t.className = "show" + (err ? " err" : "");
		clearTimeout(toast.t);
		toast.t = setTimeout(() => t.className = "", err ? 5e3 : Math.max(1800, msg.length * 55));
	}
	async function api(path, body, opts = {}) {
		const init = body === void 0 ? {} : {
			method: "POST",
			headers: opts.headers || { "Content-Type": "application/json" },
			body: opts.raw ? body : JSON.stringify(body)
		};
		const r = await PanelContext.fetch(path, {
			...init,
			signal: scope.signal
		});
		const data = await r.json().catch(() => ({ error: r.statusText }));
		if (!r.ok) {
			const e = new Error(data.error || r.statusText);
			if (r.status === 401 && data.auth) {
				e.offline = true;
				connCheck();
				throw e;
			}
			if (data.offline || /^(Колонка не ответила|Связь с колонкой потеряна)/.test(e.message)) {
				e.offline = true;
				connCheck();
			}
			throw e;
		}
		return data;
	}
	async function act(btn, fn, okMsg) {
		if (btn) btn.disabled = true;
		try {
			const r = await fn();
			if (okMsg) toast(okMsg);
			return r;
		} catch (e) {
			if (!e.offline) toast(e.message, true);
		} finally {
			if (btn) btn.disabled = false;
		}
	}
	const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;"
	})[c]);
	const revealed = /* @__PURE__ */ new Set();
	let privateOff = false;
	const DOTS = "••••••••";
	const secret = (key, v, dots = DOTS) => {
		if (!v) return "—";
		const on = privateOff || revealed.has(key);
		return `<button class="secret${on ? " shown" : ""}" data-key="${key}" data-v="${esc(v)}" data-dots="${dots}" title="Показать / скрыть">${on ? esc(v) : dots}</button>`;
	};
	function applyPrivate() {
		$$(".secret").forEach((x) => {
			const on = privateOff || revealed.has(x.dataset.key);
			x.textContent = on ? x.dataset.v : x.dataset.dots || DOTS;
			x.classList.toggle("shown", on);
		});
	}
	const hostHtml = (h) => {
		const m = /^(.*[-_])([A-Za-z0-9]{4,})$/.exec(h || "");
		return m ? esc(m[1]) + secret("serial", m[2], "••••") : esc(h || "—");
	};
	listen(document, "click", (e) => {
		const b = e.target.closest(".secret");
		if (!b) return;
		if (privateOff) return;
		revealed.has(b.dataset.key) ? revealed.delete(b.dataset.key) : revealed.add(b.dataset.key);
		applyPrivate();
	});
	const pctNum = (v) => Math.round(v / 255 * 100);
	const pct = (v) => pctNum(v) + "%";
	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
	function splitUptime(s) {
		s = Math.floor(+s);
		const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
		if (d) return [d, `д ${h} ч`];
		if (h) return [h, `ч ${m} мин`];
		return [m, "мин"];
	}
	let volDragging = false, lastOk = 0, status = null, ymLogin = "";
	async function refreshStatus() {
		try {
			const s = status = await api("/api/status");
			lastOk = Date.now();
			$("#conn").className = "dot on";
			$("#conn-text").textContent = "Подключено по adb";
			$("#conn-ip").innerHTML = secret("ip", s.ip_address);
			const temp = s.temp ? s.temp / 1e3 : null;
			$("#st-temp").textContent = temp === null ? "—" : temp.toFixed(0);
			$("#st-temp-bar").style.width = temp === null ? "0" : clamp(temp / 85 * 100, 0, 100) + "%";
			const used = (s.mem_total - s.mem_avail) / 1024, total = s.mem_total / 1024;
			$("#st-mem").textContent = Math.round(used);
			$("#st-mem-u").textContent = `из ${Math.round(total)} МБ`;
			$("#st-mem-bar").style.width = (used / total * 100).toFixed(0) + "%";
			$("#st-mem-n").textContent = `свободно ${Math.round(s.mem_avail / 1024)} МБ`;
			const rssi = +s.RSSI;
			$("#st-rssi").textContent = s.RSSI ? String(rssi).replace("-", "−") : "—";
			$("#st-rssi-bar").style.width = s.RSSI ? clamp((rssi + 90) / 60 * 100, 0, 100) + "%" : "0";
			$("#st-wifi-n").innerHTML = [
				s.ssid && { html: secret("ssid", s.ssid) },
				s.freq && (s.freq / 1e3).toFixed(1).replace(".", ",") + " ГГц",
				s.LINKSPEED && s.LINKSPEED + " Мбит/с"
			].filter(Boolean).map((x) => x.html ?? esc(x)).join(" · ") || "—";
			const [uv, uu] = splitUptime(s.uptime);
			$("#st-up").textContent = uv;
			$("#st-up-u").textContent = uu;
			const la = (s.load || "").split(" ");
			$("#st-load-bar").style.width = clamp(+la[0] / 4 * 100, 0, 100) + "%";
			$("#st-load-n").textContent = "нагрузка " + la.map((x) => x.replace(".", ",")).join(" · ");
			if (!volDragging) {
				const [m, b] = [+s.vol_level || 0, +s.vol_bt || 0];
				showLevel(m);
				$("#vol-bt").value = b;
				$("#vol-bt-v").textContent = pct(b);
			}
			$("#ffmpeg-hint").textContent = s.ffmpeg ? "FFmpeg найден — поддерживаются MP3, M4A/AAC, FLAC, OGG и WAV." : "Пока доступен WAV. Для MP3 и других форматов установи аудио-FFmpeg в Настройках.";
			window.__deviceColor = s.color;
			window.modelColor?.(s.color);
			$("#dev-info").innerHTML = [
				["Quasar", s.quasar === "running" ? "работает" : "остановлен"],
				["Версия", s.quasar_version],
				["Device ID", { html: secret("id", s.device_id) }],
				["Хост", { html: hostHtml(s.hostname) }],
				["Ядро", s.kernel],
				["MAC", { html: secret("mac", s.address) }],
				["Время", s.date]
			].map(([k, v]) => `<dt>${k}</dt><dd>${v?.html ?? esc(v ?? "—")}</dd>`).join("");
			updateSub();
		} catch {}
	}
	function updateSub() {
		if (!status) return;
		const ago = Math.round((Date.now() - lastOk) / 1e3);
		const ver = (status.quasar_version || "").split(".").slice(0, 4).join(".");
		const alive = status.quasar === "running";
		$("#ov-sub").innerHTML = `<span class="dot ${alive ? "on" : "off"}" title="${alive ? "Алиса работает" : "Алиса остановлена"}" style="display:inline-block;margin-right:6px;vertical-align:1px"></span>` + hostHtml(status.hostname) + esc(` · Quasar ${ver} · ${ago} с назад`);
	}
	setInterval(updateSub, 1e3);
	function showLevel(level) {
		$("#vol-master").value = Math.round(level);
		$("#vol-big").textContent = Math.round(level);
	}
	let volTimer;
	for (const [id, key] of [["#vol-master", "level"], ["#vol-bt", "bt"]]) {
		const el = $(id);
		el.addEventListener("input", () => {
			volDragging = true;
			if (key === "level") showLevel(+el.value);
			else $("#vol-bt-v").textContent = pct(el.value);
			clearTimeout(volTimer);
			volTimer = setTimeout(() => act(null, () => api("/api/volume", { [key]: +el.value })), 150);
		});
		el.addEventListener("change", () => setTimeout(() => volDragging = false, 1500));
	}
	$$("[data-level]").forEach((b) => b.onclick = () => act(b, async () => {
		await api("/api/volume", { level: +b.dataset.level });
		showLevel(+b.dataset.level);
	}));
	let sounds = [], sndFolder = null;
	const FOLDER_NAMES = {
		"": "Корень",
		common: "Общие",
		"ru-RU": "Русский",
		"ar-EG": "Арабский (Египет)",
		"ar-SA": "Арабский (Саудовская Аравия)",
		"kk-KZ": "Казахский"
	};
	const folderOf = (n) => n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "";
	function renderFolders() {
		const counts = {};
		sounds.forEach((n) => counts[folderOf(n)] = (counts[folderOf(n)] || 0) + 1);
		const folders = Object.keys(counts).sort((a, b) => a === "common" ? -1 : b === "common" ? 1 : a.localeCompare(b));
		if (!folders.includes(sndFolder)) sndFolder = folders.includes(store.get("snd.folder")) ? store.get("snd.folder") : folders[0];
		$("#snd-folders").innerHTML = folders.map((f) => `<button data-f="${esc(f)}" class="${f === sndFolder ? "active" : ""}" aria-pressed="${f === sndFolder}">${esc(FOLDER_NAMES[f] || f)}<span>${counts[f]}</span></button>`).join("");
		$$("#snd-folders button").forEach((b) => b.onclick = () => {
			sndFolder = b.dataset.f;
			store.set("snd.folder", sndFolder);
			renderFolders();
			renderSounds();
		});
	}
	function renderSounds() {
		const f = $("#snd-filter").value.toLowerCase();
		const list = f ? sounds.filter((n) => n.toLowerCase().includes(f)) : sounds.filter((n) => folderOf(n) === sndFolder);
		$("#snd-folders").style.opacity = f ? .5 : 1;
		$("#sounds").innerHTML = list.length ? list.map((n) => {
			const base = n.slice(n.lastIndexOf("/") + 1);
			const m = base.match(/^(.*)\.([^.]+)$/) || [
				base,
				base,
				""
			];
			const dir = folderOf(n);
			return `<div class="sound"><button class="play" data-s="${esc(n)}" aria-label="Проиграть ${esc(m[1])}">${icon("i-play", 14)}</button>
      <div class="nm" title="${esc(n)}">${esc(m[1])}</div><span class="ext">${f && dir ? esc(dir) + " · " : ""}${esc(m[2])}</span></div>`;
		}).join("") : "<div class=\"empty\">Ничего не найдено</div>";
		$$("#sounds .play").forEach((b) => b.onclick = () => act(b, () => api("/api/play", { name: b.dataset.s }), "▶ " + b.dataset.s));
	}
	async function loadSounds() {
		sounds = await api("/api/sounds");
		renderFolders();
		renderSounds();
	}
	$("#snd-filter").oninput = renderSounds;
	$("#stop-sound").onclick = (e) => act(e.currentTarget, () => api("/api/stop", {}), "Остановлено");
	async function uploadFile(f) {
		if (!f) return;
		toast("Загрузка " + f.name + "…");
		await act(null, () => api("/api/upload", f, {
			raw: true,
			headers: {
				"Content-Type": "application/octet-stream",
				"X-Filename": encodeURIComponent(f.name)
			}
		}), "▶ " + f.name);
	}
	const drop = $("#drop");
	drop.onclick = () => $("#file").click();
	$("#file").onchange = (e) => {
		uploadFile(e.target.files[0]);
		e.target.value = "";
	};
	drop.ondragover = (e) => {
		e.preventDefault();
		drop.classList.add("over");
	};
	drop.ondragleave = () => drop.classList.remove("over");
	drop.ondrop = (e) => {
		e.preventDefault();
		drop.classList.remove("over");
		uploadFile(e.dataTransfer.files[0]);
	};
	const SEGS = "ABCDEFGH";
	const X_DEG = 32, X_DH = 33, X_DL = 34, X_DM = 35, NLED = 36;
	const SEGMENTS = {
		"0": "ABCDEF",
		"1": "BC",
		"2": "ABDEG",
		"3": "ABCDG",
		"4": "BCFG",
		"5": "ACDFG",
		"6": "ACDEFG",
		"7": "ABC",
		"8": "ABCDEFG",
		"9": "ABCDFG",
		A: "ABCEFG",
		B: "CDEFG",
		C: "ADEF",
		D: "BCDEG",
		E: "ADEFG",
		F: "AEFG",
		G: "ACDEF",
		H: "BCEFG",
		I: "EF",
		J: "BCDE",
		L: "DEF",
		N: "CEG",
		O: "CDEG",
		P: "ABEFG",
		R: "EG",
		S: "ACDFG",
		T: "DEFG",
		U: "BCDEF",
		Y: "BCDFG",
		"-": "G",
		"_": "D",
		" ": "",
		"°": "ABFG"
	};
	const blankFrame = () => new Array(NLED).fill(0);
	function textToFrame(text, bright = 255, extras = {}) {
		const v = blankFrame();
		let pos = -1;
		for (const ch of String(text).toUpperCase()) {
			if (ch === ":") {
				v[X_DH] = v[X_DL] = bright;
				continue;
			}
			if (ch === ".") {
				if (pos >= 0) v[pos * 8 + 7] = bright;
				continue;
			}
			if (++pos > 3) break;
			for (const s of SEGMENTS[ch] ?? "") v[pos * 8 + SEGS.indexOf(s)] = bright;
		}
		if (extras.dh) v[X_DH] = bright;
		if (extras.dl) v[X_DL] = bright;
		if (extras.dm) v[X_DM] = bright;
		if (extras.degree) v[X_DEG] = bright;
		return v;
	}
	const DIGIT_X = [
		0,
		70,
		172,
		242
	];
	function segShapes(x) {
		const t = 10, w = 56, h = 96, m = h / 2;
		return [
			["A", `M${x + 6} 0h44l-6 ${t}h-32z`],
			["B", `M${x + w} 6v39l-${t} -5v-27z`],
			["C", `M${x + w} 51v39l-${t} -6v-27z`],
			["D", `M${x + 6} ${h}h44l-6 -${t}h-32z`],
			["E", `M${x} 51v39l${t} -6v-27z`],
			["F", `M${x} 6v39l${t} -5v-27z`],
			["G", `M${x + 4} ${m}l6 -${t / 2}h36l6 ${t / 2}l-6 ${t / 2}h-36z`]
		];
	}
	function clockSVG(v, { thumb = false } = {}) {
		const lvl = (i) => v[i] / 255;
		const cls = (i) => v[i] > 0 ? "seg-on" : "seg-off";
		const op = (i) => v[i] > 0 ? ` fill-opacity="${(.5 + .5 * lvl(i)).toFixed(2)}"` : "";
		let s = `<svg viewBox="-4 -4 340 112" role="img" aria-label="Дисплей часов">`;
		DIGIT_X.forEach((x, p) => {
			for (const [seg, d] of segShapes(x)) {
				const i = p * 8 + SEGS.indexOf(seg);
				s += `<path d="${d}" class="${cls(i)}"${op(i)} data-i="${i}"/>`;
			}
			const i = p * 8 + 7;
			s += `<circle cx="${x + 28}" cy="36" r="4.5" class="${cls(i)}"${op(i)} data-i="${i}"/>`;
		});
		[[X_DH, 30], [X_DL, 66]].forEach(([i, y]) => s += `<circle cx="146" cy="${y}" r="6" class="${cls(i)}"${op(i)} data-i="${i}"/>`);
		s += `<rect x="137" y="45" width="18" height="6" rx="2" class="${cls(X_DM)}"${op(X_DM)} data-i="${X_DM}"/>`;
		const di = X_DEG;
		s += `<circle cx="318" cy="10" r="7" stroke-width="4" class="${v[di] > 0 ? "deg-on" : "deg-off"}"${v[di] > 0 ? ` stroke-opacity="${Math.max(.18, lvl(di)).toFixed(2)}"` : ""} data-i="${di}"/>`;
		if (!thumb) s += `<circle cx="318" cy="10" r="11" fill="transparent" data-i="${di}"/>`;
		return s + "</svg>";
	}
	window.clockGeom = {
		segShapes,
		DIGIT_X,
		SEGS,
		X_DH,
		X_DL,
		X_DM,
		X_DEG
	};
	const toModel = (v) => window.modelShow?.(v);
	const toRing = (leds) => window.modelRing?.(leds);
	function animate(el, frames, { seconds = 10, onFrame } = {}) {
		clearTimeout(el._anim);
		if (!frames.length) return;
		const until = el._until = Date.now() + seconds * 1e3;
		const loopAt = frames.findIndex((f) => f.flag);
		let i = 0;
		const step = () => {
			if (Date.now() > until) return el._animDone?.();
			if (i >= frames.length) {
				if (loopAt < 0) return el._animDone?.();
				i = loopAt;
			}
			el.innerHTML = clockSVG(frames[i].v);
			if (el.id === "clock-preview") toModel(frames[i].v);
			onFrame?.(i);
			el._anim = setTimeout(step, Math.max(16, frames[i++].ms));
		};
		step();
	}
	let patterns = {}, patKind = "ring";
	const PAT_NAMES = {
		alice_listening: "Алиса слушает",
		alice_speaking: "Алиса говорит",
		alice_thinking: "Алиса думает",
		alice_pro_listening: "Алиса Про слушает",
		alice_pro_speaking: "Алиса Про говорит",
		alice_pro_thinking: "Алиса Про думает",
		intonation_spotting: "Распознала интонацию",
		player_continue: "Продолжить",
		player_pause: "Пауза",
		player_next_track: "Следующий трек",
		player_previous_track: "Предыдущий трек",
		volume: "Громкость",
		bluetooth_on: "Bluetooth включён",
		bluetooth_connected: "Bluetooth подключён",
		bluetooth_playing: "Музыка по Bluetooth",
		call_incoming: "Входящий звонок",
		call_outgoing: "Исходящий звонок",
		call_connecting: "Соединяю",
		call_connected: "Разговор",
		call_connected_nanny: "Разговор (радионяня)",
		call_ended: "Звонок завершён",
		ringing: "Звонок",
		timer: "Таймер",
		notification_available: "Есть уведомление",
		notification_passive: "Тихое уведомление",
		iot_discovery: "Поиск устройств умного дома",
		boot: "Загрузка",
		configure: "Настройка",
		configuring: "Настройка",
		connecting_to_network: "Подключение к сети",
		clock_sync_1: "Синхронизация часов 1",
		clock_sync_2: "Синхронизация часов 2",
		update_downloading: "Скачивание обновления",
		update_applying: "Установка обновления",
		confirm_data_reset: "Подтвердите сброс",
		error: "Ошибка",
		progress: "Прогресс",
		soundinit: "Инициализация звука",
		qc: "Заводской тест",
		battery_cold: "Батарея замёрзла",
		battery_hot: "Батарея перегрелась",
		low_battery: "Низкий заряд",
		blink: "Моргание"
	};
	const PAT_GROUPS = [
		["Алиса", /^(alice_|intonation)/],
		["Плеер и звук", /^(player_|volume|bluetooth_)/],
		["Звонки", /^(call_|ringing)/],
		["Уведомления и таймер", /^(timer|notification_|iot_)/],
		["Система", /^(boot|configur|connecting|clock_sync|update_|confirm_|error|progress|soundinit|qc|battery_|low_battery)/]
	];
	const patBase = (n) => n.replace(/\.(bin)?s?cled(\.zst)?$|\.led$/, "");
	function renderPatterns() {
		const list = patterns[patKind] || [];
		const groups = PAT_GROUPS.map(([title, re]) => [title, list.filter((n) => re.test(patBase(n)))]);
		const rest = list.filter((n) => !PAT_GROUPS.some(([, re]) => re.test(patBase(n))));
		if (rest.length) groups.push(["Прочее", rest]);
		$("#patterns").innerHTML = groups.filter(([, items]) => items.length).map(([title, items]) => `<div class="pat-group">${esc(title)}</div>` + items.map((n) => {
			const base = patBase(n);
			return `<button class="pat" data-p="${esc(n)}"><span class="pat-play">${icon("i-play", 11)}</span>
        <span class="pat-name">${esc(PAT_NAMES[base] || base.replace(/_/g, " "))}</span><span class="pat-sys">${esc(base)}</span></button>`;
		}).join("")).join("");
		$$("#patterns .pat").forEach((b) => b.onclick = () => act(b, async () => {
			const seconds = +$("#pat-sec").value || 5;
			await api("/api/pattern", {
				kind: patKind,
				name: b.dataset.p,
				seconds
			});
			if (patKind === "ring") animateRing(await api("/api/ring/frames?name=" + encodeURIComponent(b.dataset.p)), seconds);
			if (patKind === "clock") {
				const frames = await api("/api/clock/frames?name=" + encodeURIComponent(b.dataset.p));
				const el = $("#clock-preview");
				el._animDone = clockPreview;
				animate(el, frames, { seconds });
			}
		}, "✦ " + b.querySelector(".pat-name").textContent));
	}
	$$("#pat-kind button").forEach((b) => b.onclick = () => {
		$$("#pat-kind button").forEach((x) => x.classList.toggle("active", x === b));
		patKind = b.dataset.k;
		renderPatterns();
	});
	$("#pat-stop").onclick = (e) => act(e.currentTarget, async () => {
		await api("/api/pattern/stop", {});
		clearTimeout($("#clock-preview")._anim);
		clockPreview();
		clearTimeout(ringTimer);
		ringAnimUntil = 0;
	}, "Анимации остановлены");
	const hex2rgb = (h) => [
		1,
		3,
		5
	].map((i) => parseInt(h.slice(i, i + 2), 16));
	let ringHex = "#6C47FF";
	function pickColor(hex) {
		ringHex = hex.toUpperCase();
		$("#ring-preview").style.setProperty("--ring", ringHex);
		$$("#swatches .sw").forEach((s) => s.classList.toggle("sel", s.dataset.hex === ringHex));
	}
	const setRing = (btn, rgb, on) => act(btn, async () => {
		await api("/api/ring", {
			red: rgb[0],
			green: rgb[1],
			blue: rgb[2]
		});
		$("#ring-preview").classList.toggle("off", !on);
		toRing([
			rgb,
			rgb,
			rgb
		]);
	});
	$$("#swatches .sw").forEach((b) => b.onclick = () => {
		pickColor(b.dataset.hex);
		setRing(b, hex2rgb(ringHex), true);
	});
	$("#ring-color").oninput = (e) => pickColor(e.target.value);
	$("#ring-color").onchange = (e) => setRing(null, hex2rgb(e.target.value), true);
	$("#ring-set").onclick = (e) => setRing(e.currentTarget, hex2rgb(ringHex), true);
	$("#ring-off").onclick = (e) => setRing(e.currentTarget, [
		0,
		0,
		0
	], false);
	$("#ring-reset").onclick = (e) => act(e.currentTarget, async () => {
		const r = await api("/api/ring/reset", {});
		toRing(r.leds);
		$("#ring-preview").classList.toggle("off", r.leds.every((c) => c.every((x) => !x)));
	}, "Кольцо снова у Алисы");
	pickColor(ringHex);
	const pad2 = (n) => String(n).padStart(2, "0");
	const pcTime = () => {
		const d = /* @__PURE__ */ new Date();
		return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
	};
	const clockExtras = () => ({
		dh: $("#x-dh").checked,
		dl: $("#x-dl").checked,
		dm: $("#x-dm").checked,
		degree: $("#x-degree").checked
	});
	let dispMode = "text", dispState = { mode: null }, dispStateAt = 0;
	const DISP_NAMES = {
		frame: "текст",
		date: "дата",
		temp: "температура",
		timer: "таймер"
	};
	function timerSeconds() {
		const m = ($("#timer-val").value || "").match(/^(\d{1,2})(?::(\d{1,2}))?$/);
		return m ? +m[1] * 60 + +(m[2] || 0) : 0;
	}
	function clockFrame() {
		const br = +$("#clock-br").value;
		if (dispMode === "date") {
			const d = /* @__PURE__ */ new Date(), v = textToFrame(`${pad2(d.getDate())}${pad2(d.getMonth() + 1)}`, br);
			v[X_DL] = br;
			return v;
		}
		if (dispMode === "temp") return textToFrame(String(Math.round((status?.temp || 0) / 1e3)).padStart(4, " "), br, { degree: true });
		if (dispMode === "timer") {
			const s = timerSeconds();
			return textToFrame(`${pad2(Math.min(99, Math.floor(s / 60)))}:${pad2(s % 60)}`, br);
		}
		return textToFrame($("#clock-text").value || pcTime(), br, clockExtras());
	}
	function clockPreview() {
		const el = $("#clock-preview");
		clearTimeout(el._anim);
		el._until = 0;
		el.innerHTML = clockSVG(clockFrame());
	}
	[
		"#clock-text",
		"#x-dh",
		"#x-dl",
		"#x-dm",
		"#x-degree",
		"#timer-val"
	].forEach((s) => $(s).addEventListener("input", clockPreview));
	$("#clock-br").oninput = (e) => {
		$("#clock-br-v").textContent = e.target.value;
		clockPreview();
	};
	$$("#disp-mode button").forEach((b) => b.onclick = () => {
		dispMode = b.dataset.m;
		$$("#disp-mode button").forEach((x) => x.classList.toggle("active", x === b));
		$("#dm-text").hidden = dispMode !== "text";
		$("#dm-timer").hidden = dispMode !== "timer";
		$("#clock-set").hidden = dispMode !== "text";
		$("#disp-pin").textContent = dispMode === "timer" ? "Запустить таймер" : "Закрепить";
		clockPreview();
	});
	$$("#dm-timer [data-t]").forEach((b) => b.onclick = () => {
		const s = +b.dataset.t;
		$("#timer-val").value = `${pad2(s / 60 | 0)}:${pad2(s % 60)}`;
		clockPreview();
	});
	function renderDispState() {
		const st = dispState, on = !!st.mode;
		$("#disp-badge").hidden = !on;
		if (!on) return;
		let text = "закреплено: " + (DISP_NAMES[st.mode] || st.mode);
		if (st.mode === "timer" && st.left != null) {
			const left = Math.max(0, st.left - Math.round((Date.now() - dispStateAt) / 1e3));
			text = `таймер ${pad2(left / 60 | 0)}:${pad2(left % 60)}`;
		}
		$("#disp-badge").textContent = text;
		$("#disp-badge").className = "badge ok";
	}
	async function loadDispState() {
		if (document.hidden || $("#tab-overview").hidden) return;
		try {
			dispState = await api("/api/display");
			dispStateAt = Date.now();
			renderDispState();
		} catch {}
	}
	setInterval(loadDispState, 5e3);
	setInterval(() => dispState.mode === "timer" && renderDispState(), 1e3);
	$("#disp-pin").onclick = (e) => act(e.currentTarget, async () => {
		const body = {
			mode: dispMode === "text" ? "frame" : dispMode,
			brightness: +$("#clock-br").value
		};
		if (dispMode === "text") body.v = clockFrame();
		if (dispMode === "timer") {
			body.seconds = timerSeconds();
			if (!body.seconds) throw new Error("Время таймера — в виде мм:сс, например 05:00");
		}
		dispState = await api("/api/display", body);
		dispStateAt = Date.now();
		renderDispState();
	}, dispMode === "timer" ? "Таймер запущен" : "Закреплено");
	$("#disp-stop").onclick = (e) => act(e.currentTarget, async () => {
		dispState = await api("/api/display/stop", {});
		await api("/api/pattern/stop", {}).catch(() => {});
		renderDispState();
		$("#clock-text").value = "";
		clockPreview();
	}, "Дисплей снова показывает часы");
	function sendClock(btn) {
		const text = $("#clock-text").value || pcTime();
		clockPreview();
		return act(btn, async () => {
			await api("/api/clock", { v: clockFrame() });
			toModel(clockFrame());
			dispState = { mode: null };
			renderDispState();
		}, "На дисплее: " + text);
	}
	$("#clock-set").onclick = (e) => sendClock(e.currentTarget);
	$("#clock-text").onkeydown = (e) => {
		if (e.key === "Enter") sendClock(null);
	};
	clockPreview();
	setInterval(() => (dispMode !== "text" || !$("#clock-text").value) && Date.now() > ($("#clock-preview")._until || 0) && clockPreview(), 15e3);
	let ringAnimUntil = 0, ringLit = false, ringTimer;
	async function pollLeds() {
		try {
			if (!document.hidden && !$("#tab-overview").hidden) {
				const s = await api("/api/clock/state");
				if (Date.now() >= ($("#clock-preview")._until || 0)) toModel(s.v);
				if (Date.now() >= ringAnimUntil) toRing(s.ring);
				ringLit = s.ring.some((c) => c.some((x) => x > 0));
			}
		} catch {}
		setTimeout(pollLeds, ringLit ? 400 : 1500);
	}
	pollLeds();
	const isSpectrum = (v) => [
		0,
		1,
		2,
		3
	].every((p) => !v[p * 8 + 1] && !v[p * 8 + 2] && !v[p * 8 + 4] && !v[p * 8 + 5] && !v[p * 8 + 7]) && !v[X_DEG] && !v[X_DH] && !v[X_DL] && !v[X_DM];
	async function liveLeds() {
		const want = online && !document.hidden && !$("#tab-overview").hidden && !window.__vizOff && !!muState()?.playing;
		if (want) try {
			const r = await api("/api/leds/live");
			if (r.v) {
				const v = r.v;
				if (isSpectrum(v)) window.__spectrum = {
					bands: [
						0,
						1,
						2,
						3
					].map((p) => (v[p * 8] + v[p * 8 + 3] + v[p * 8 + 6]) / 756),
					t: performance.now()
				};
				if (Date.now() >= ($("#clock-preview")._until || 0)) toModel(v);
				if (Date.now() >= ringAnimUntil) toRing(r.ring);
			}
		} catch {}
		const spectrumNow = window.__spectrum && performance.now() - window.__spectrum.t < 2500;
		setTimeout(liveLeds, want ? spectrumNow ? 100 : 700 : 500);
	}
	setTimeout(liveLeds, 1e3);
	function animateRing({ frames, loop }, seconds) {
		clearTimeout(ringTimer);
		if (!frames.length) return;
		const until = ringAnimUntil = Date.now() + seconds * 1e3;
		let i = 0;
		const step = () => {
			if (Date.now() > until) {
				ringAnimUntil = 0;
				return;
			}
			if (i >= frames.length) {
				if (!loop) {
					ringAnimUntil = 0;
					return;
				}
				i = 0;
			}
			toRing(frames[i].c);
			ringTimer = setTimeout(step, Math.max(16, frames[i++].ms));
		};
		step();
	}
	const boot = {
		frames: [],
		sel: 0,
		def: [],
		status: null
	};
	const bootCur = () => boot.frames[boot.sel];
	function setBootFrames(frames) {
		frames = structuredClone(frames || []);
		const lead = frames[0] && frames[0].v.every((x) => x === 0) ? frames.shift().ms : 0;
		$("#boot-pause").value = lead;
		boot.frames = frames;
		boot.sel = 0;
		checkPause();
	}
	function bootFull() {
		const pause = clamp(+$("#boot-pause").value || 0, 0, 65535);
		return pause ? [{
			flag: 0,
			v: blankFrame(),
			ms: pause
		}, ...boot.frames] : boot.frames;
	}
	function checkPause() {
		const short = (+$("#boot-pause").value || 0) < 3e3;
		$("#boot-pause-hint").style.color = short ? "var(--danger)" : "";
	}
	$("#boot-pause").oninput = checkPause;
	async function uploadBootSound(f) {
		if (!f) return;
		toast("Перекодирую и устанавливаю " + f.name + "…");
		await act($("#bs-drop"), async () => {
			boot.status = await api("/api/boot/sound", f, {
				raw: true,
				headers: {
					"Content-Type": "application/octet-stream",
					"X-Filename": encodeURIComponent(f.name)
				}
			});
			renderBootStatus();
		}, "Звук запуска заменён");
	}
	const bsDrop = $("#bs-drop");
	bsDrop.onclick = () => $("#bs-file").click();
	$("#bs-file").onchange = (e) => {
		uploadBootSound(e.target.files[0]);
		e.target.value = "";
	};
	bsDrop.ondragover = (e) => {
		e.preventDefault();
		bsDrop.classList.add("over");
	};
	bsDrop.ondragleave = () => bsDrop.classList.remove("over");
	bsDrop.ondrop = (e) => {
		e.preventDefault();
		bsDrop.classList.remove("over");
		uploadBootSound(e.dataTransfer.files[0]);
	};
	$("#bs-play-default").onclick = (e) => act(e.currentTarget, () => api("/api/boot/sound/play", { which: "default" }), "▶ стандартный звук запуска");
	$("#bs-play-custom").onclick = (e) => act(e.currentTarget, () => api("/api/boot/sound/play", { which: "custom" }), "▶ свой звук запуска");
	$("#bs-stop").onclick = (e) => act(e.currentTarget, () => api("/api/stop", {}));
	$("#bs-reset").onclick = (e) => confirm("Вернуть стандартный звук запуска?") && act(e.currentTarget, async () => {
		boot.status = await api("/api/boot/sound/reset", {});
		renderBootStatus();
	}, "Стандартный звук восстановлен");
	$("#boot-always").onchange = (e) => act(e.target, async () => {
		try {
			boot.status = await api("/api/clock/boot/always", { enabled: e.target.checked });
		} finally {
			renderBootStatus();
		}
	}, e.target.checked ? "Заставка и звук будут при каждой загрузке" : "Заставка и звук — только когда Quasar сам решит");
	function renderBoot() {
		if (!boot.frames.length) boot.frames = [{
			flag: 0,
			v: blankFrame(),
			ms: 1e3
		}];
		boot.sel = clamp(boot.sel, 0, boot.frames.length - 1);
		$("#boot-frames").innerHTML = boot.frames.map((f, i) => `<button class="frame-thumb ${i === boot.sel ? "sel" : ""}" data-k="${i}" aria-label="Кадр ${i + 1}">${clockSVG(f.v, { thumb: true })}<span>${i + 1} · ${f.ms} мс</span></button>`).join("") + `<button class="frame-add" id="boot-add" aria-label="Добавить кадр">${icon("i-plus", 18)}</button>`;
		$$("#boot-frames .frame-thumb").forEach((b) => b.onclick = () => {
			boot.sel = +b.dataset.k;
			renderBoot();
		});
		$("#boot-add").onclick = () => {
			boot.frames.splice(boot.sel + 1, 0, {
				flag: 0,
				v: blankFrame(),
				ms: 500
			});
			boot.sel++;
			renderBoot();
		};
		$("#boot-editor").innerHTML = clockSVG(bootCur().v);
		$("#boot-ms").value = bootCur().ms;
	}
	function renderBootStatus() {
		const s = boot.status;
		if (!s) return;
		$("#boot-always").checked = !!s.always;
		$("#boot-hook-badge").textContent = s.hook ? "хук подключён" : "хук не нужен";
		$("#boot-hook-badge").className = "badge" + (s.hook ? " ok" : "");
		$("#snd-badge").textContent = !s.sound_supported ? "не поддерживается" : s.sound_custom ? "свой" : "стандартный";
		$("#snd-badge").className = "badge" + (s.sound_custom ? " ok" : "");
		$("#bs-play-custom").disabled = !s.sound_custom;
		$("#bs-reset").disabled = !s.sound_custom;
		if (!s.supported) {
			$("#boot-status").innerHTML = "<span class=\"badge bad\">прошивка не поддерживается</span>";
			return;
		}
		$("#boot-status").innerHTML = s.custom ? `<span class="badge ok">своя</span>${s.mounted ? "" : "<span class=\"badge bad\">не подменена</span>"}` : "<span class=\"badge\">стандартная</span>";
	}
	async function loadBoot() {
		try {
			boot.status = await api("/api/clock/boot");
			boot.def = boot.status.default || [];
			setBootFrames(boot.status.frames || boot.def);
			renderBootStatus();
			renderBoot();
		} catch (e) {
			$("#boot-status").innerHTML = `<span class="badge bad">${esc(e.message)}</span>`;
		}
	}
	$("#boot-editor").onclick = (e) => {
		const i = e.target.closest("[data-i]")?.dataset.i;
		if (i === void 0) return;
		const v = bootCur().v;
		v[i] = v[i] > 0 ? 0 : 255;
		renderBoot();
	};
	$("#boot-ms").onchange = (e) => {
		bootCur().ms = clamp(+e.target.value || 100, 10, 65535);
		renderBoot();
	};
	const applyBootText = () => {
		bootCur().v = textToFrame($("#boot-text").value);
		renderBoot();
	};
	$("#boot-text-apply").onclick = applyBootText;
	$("#boot-text").onkeydown = (e) => {
		if (e.key === "Enter") applyBootText();
	};
	$("#boot-dup").onclick = () => {
		boot.frames.splice(boot.sel + 1, 0, structuredClone(bootCur()));
		boot.sel++;
		renderBoot();
	};
	$("#boot-clear").onclick = () => {
		bootCur().v = blankFrame();
		renderBoot();
	};
	$("#boot-del").onclick = () => {
		boot.frames.splice(boot.sel, 1);
		renderBoot();
	};
	const moveFrame = (d) => {
		const j = boot.sel + d;
		if (j < 0 || j >= boot.frames.length) return;
		[boot.frames[boot.sel], boot.frames[j]] = [boot.frames[j], boot.frames[boot.sel]];
		boot.sel = j;
		renderBoot();
	};
	$("#boot-left").onclick = () => moveFrame(-1);
	$("#boot-right").onclick = () => moveFrame(1);
	const bootDuration = () => Math.ceil(bootFull().reduce((a, f) => a + f.ms, 0) / 1e3) + 1;
	$("#boot-preview").onclick = () => {
		const el = $("#boot-editor");
		el._animDone = renderBoot;
		const off = bootFull().length - boot.frames.length;
		animate(el, bootFull(), {
			seconds: bootDuration(),
			onFrame: (i) => $$("#boot-frames .frame-thumb").forEach((b, k) => b.classList.toggle("sel", k === i - off))
		});
	};
	$("#boot-device").onclick = (e) => act(e.currentTarget, () => api("/api/clock/play", {
		frames: bootFull(),
		seconds: bootDuration()
	}), "Заставка играет на колонке");
	$("#boot-load-default").onclick = () => {
		if (!boot.def.length) return toast("Стандартная заставка недоступна", true);
		setBootFrames(boot.def);
		renderBoot();
	};
	$("#boot-install").onclick = (e) => confirm("Установить эту заставку на загрузку колонки?") && act(e.currentTarget, async () => {
		boot.status = await api("/api/clock/boot", { frames: bootFull() });
		renderBootStatus();
	}, "Заставка установлена — покажется при следующей загрузке");
	$("#boot-reset").onclick = (e) => confirm("Вернуть стандартную заставку часов?") && act(e.currentTarget, async () => {
		await api("/api/clock/boot/reset", {});
		await loadBoot();
	}, "Стандартная заставка восстановлена");
	let btData = null, btTimer;
	const BT_ICONS = {
		phone: "i-bt",
		"audio-card": "i-vol",
		"audio-headset": "i-vol",
		"audio-headphones": "i-vol",
		computer: "i-term"
	};
	async function loadBt() {
		clearTimeout(btTimer);
		if (!online || document.hidden || $("#tab-overview").hidden || $("[data-widget=\"bt\"]").closest("#wz-hidden")) {
			btTimer = setTimeout(loadBt, 3e3);
			return;
		}
		try {
			btData = await api("/api/bt");
			renderBt();
		} catch (e) {
			if (!e.offline) $("#bt-list").innerHTML = `<div class="empty">${esc(e.message)}</div>`;
		}
		btTimer = setTimeout(loadBt, btData?.pair_until ? 2e3 : 5e3);
	}
	function btLeft() {
		const left = btData?.pair_until ? Math.max(0, Math.round(btData.pair_until - Date.now() / 1e3)) : 0;
		$("#bt-pair-left").hidden = !left;
		$("#bt-pair-left").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
	}
	setInterval(() => btData?.pair_until && btLeft(), 1e3);
	function renderBt() {
		const d = btData, conn = d.devices.filter((x) => x.connected), vis = d.discoverable;
		$("#bt-badge").textContent = !d.powered ? "выключен" : conn.length ? "подключено" : "включён";
		$("#bt-badge").className = "badge" + (d.powered ? " ok" : "");
		$(".bt-pair").classList.toggle("on", vis);
		$("#bt-pair-text").textContent = vis ? "Колонка видна" : "Колонка скрыта";
		$("#bt-pair-hint").innerHTML = vis ? `Выберите «${d.alias ? hostHtml(d.alias) : "колонку"}» в настройках Bluetooth телефона` : `Чтобы подключить новое устройство, сделайте её видимой на 3 минуты`;
		$("#bt-pair-btn").textContent = vis ? "Скрыть" : "Сделать видимой";
		$("#bt-pair-btn").classList.toggle("primary", !vis);
		btLeft();
		$("#bt-list").innerHTML = d.devices.length ? d.devices.map((x) => `<div class="bt-row${x.connected ? " on" : ""}" data-mac="${esc(x.mac)}">
      <div class="bt-ic">${icon(BT_ICONS[x.icon] || "i-bt", 18)}</div>
      <div class="info"><b>${x.name ? secret("btn-" + x.mac, x.name) : "Без имени"}</b>
        <span class="meta">${[x.connected ? "подключено" : "сопряжено", x.battery != null ? `батарея ${x.battery}%` : ""].filter(Boolean).join(" · ")} · ${secret("bt-" + x.mac, x.mac)}</span></div>
      <div class="actions">${x.connected ? "<button class=\"btn sm\" data-bta=\"disconnect\">Отключить</button>" : "<button class=\"btn sm\" data-bta=\"connect\">Подключить</button>"}
        <button class="btn sm ghost" data-bta="remove" title="Забыть устройство" aria-label="Забыть устройство">${icon("i-trash", 16)}</button></div></div>`).join("") : "<div class=\"empty\">Сопряжённых устройств нет</div>";
	}
	const btDo = (btn, body, msg) => act(btn, async () => {
		btData = await api("/api/bt", body);
		renderBt();
	}, msg);
	$("#bt-pair-btn").onclick = (e) => btDo(e.currentTarget, { action: btData?.discoverable ? "pair_off" : "pair_on" }, btData?.discoverable ? "Колонка скрыта" : "Колонка видна 3 минуты");
	$("#bt-list").onclick = (e) => {
		const b = e.target.closest("[data-bta]");
		if (!b) return;
		const row = b.closest(".bt-row"), dev = btData.devices.find((x) => x.mac === row.dataset.mac), a = b.dataset.bta;
		if (a === "remove" && !confirm(`Забыть «${dev?.name || dev?.mac}»? Чтобы подключиться снова, понадобится новое сопряжение.`)) return;
		if (a === "connect") toast("Подключаемся… устройство должно быть рядом и с включённым Bluetooth");
		btDo(b, {
			action: a,
			mac: row.dataset.mac
		}, {
			connect: "Подключено",
			disconnect: "Отключено",
			remove: "Устройство забыто"
		}[a]);
	};
	loadBt();
	$("#q-restart").onclick = (e) => confirm("Перезапустить Quasar? Алиса будет недоступна ~30 с.") && act(e.currentTarget, () => api("/api/system", { action: "quasar_restart" }), "Quasar перезапускается…");
	$("#reboot").onclick = (e) => confirm("Перезагрузить колонку?") && act(e.currentTarget, () => api("/api/system", { action: "reboot" }), "Перезагрузка…");
	let logText = "";
	function maskLog(t) {
		const st = status || {}, serial = /[-_]([A-Za-z0-9]{4,})$/.exec(st.hostname || "")?.[1];
		const uids = new Set([...t.matchAll(/(?:passport_uid|puid|uid)"?\s*[:=]\s*"?(\d{5,})/gi)].map((m) => m[1]));
		for (const v of [
			st.device_id,
			st.ssid,
			st.address,
			ymLogin,
			serial,
			...uids
		].filter((v) => v && v.length >= 4)) t = t.split(v).join("••••");
		return t.replace(/\b(?:y0_|AQAAAA)[\w-]{10,}/g, "••••").replace(/(token["']?\s*[:=]\s*["']?)[\w.-]{20,}/gi, "$1••••").replace(/(\b[Aa]ccount[ :=]+)\d{5,}/g, "$1••••").replace(/("wifi_hash"\s*:\s*")[0-9a-f]+/g, "$1••••").replace(/\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi, "••:••:••:••:••:••");
	}
	function renderLog() {
		const f = $("#log-filter").value.toLowerCase();
		const out = $("#log-out");
		const atBottom = out.scrollTop + out.clientHeight >= out.scrollHeight - 20;
		const text = $("#log-mask").checked ? maskLog(logText) : logText;
		out.textContent = f ? text.split("\n").filter((l) => l.toLowerCase().includes(f)).join("\n") : text;
		if (atBottom) out.scrollTop = out.scrollHeight;
	}
	async function loadLog(btn) {
		const r = await act(btn, () => api(`/api/log?name=${encodeURIComponent($("#log-name").value)}&lines=${$("#log-lines").value}`));
		if (r) {
			logText = r.text;
			renderLog();
		}
	}
	$("#log-load").onclick = (e) => loadLog(e.currentTarget);
	$("#log-name").onchange = () => {
		$("#log-out").scrollTop = 1e9;
		loadLog();
	};
	$("#log-lines").onchange = () => loadLog();
	$("#log-filter").oninput = renderLog;
	$("#log-mask").onchange = renderLog;
	setInterval(() => $("#log-follow").checked && !$("#tab-logs").hidden && loadLog(), 3e3);
	let term = null, termFit = null, termWs = null;
	async function copyText(text) {
		try {
			if (navigator.clipboard && isSecureContext) {
				await navigator.clipboard.writeText(text);
				return true;
			}
		} catch {}
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.setAttribute("readonly", "");
		ta.style.cssText = "position:fixed;left:-9999px;top:0";
		document.body.append(ta);
		ta.select();
		let ok = false;
		try {
			ok = document.execCommand("copy");
		} catch {}
		ta.remove();
		term?.focus();
		return ok;
	}
	function termState(text, ok) {
		$("#term-state").textContent = text;
		$("#term-state").className = "badge" + (ok ? " ok" : "");
	}
	function termInit() {
		if (term) return true;
		if (!window.Terminal || !window.FitAddon) {
			$("#term").textContent = document.readyState === "loading" ? "Загрузка терминала…" : "Не загрузился xterm.js";
			return false;
		}
		$("#term").textContent = "";
		term = new Terminal({
			fontFamily: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
			fontSize: 13,
			lineHeight: 1.2,
			cursorBlink: true,
			scrollback: 5e3,
			allowProposedApi: false,
			theme: {
				background: "#111116",
				foreground: "#E6E6EB",
				cursor: "#A78BFA",
				selectionBackground: "#6C47FF66",
				black: "#16161D",
				brightBlack: "#5F5F6E"
			}
		});
		termFit = new FitAddon.FitAddon();
		term.loadAddon(termFit);
		term.open($("#term"));
		const copySel = () => {
			const text = term.getSelection();
			if (!text) return false;
			copyText(text).then((ok) => ok && toast("Скопировано"));
			return true;
		};
		$("#term").addEventListener("mouseup", () => setTimeout(copySel, 0));
		term.attachCustomKeyEventHandler((e) => {
			if (e.type !== "keydown" || !e.ctrlKey || e.altKey || e.code !== "KeyC") return true;
			if (e.shiftKey || term.hasSelection()) {
				copySel();
				term.clearSelection();
				e.preventDefault();
				return false;
			}
			return true;
		});
		term.onData((d) => {
			if (termWs?.readyState === 1) termWs.send(JSON.stringify({
				t: "i",
				d
			}));
			else if (d === "\r") termConnect();
		});
		term.onResize(({ cols, rows }) => termWs?.readyState === 1 && termWs.send(JSON.stringify({
			t: "r",
			c: cols,
			r: rows
		})));
		new ResizeObserver(() => {
			if (shownTab === "console") try {
				termFit.fit();
			} catch {}
		}).observe($("#term"));
		return true;
	}
	function termConnect() {
		if (!termInit() || termWs) return;
		try {
			termFit.fit();
		} catch {}
		termState("подключение…");
		const ws = new WebSocket(PanelContext.websocket(`/api/term?cols=${term.cols}&rows=${term.rows}`));
		ws.binaryType = "arraybuffer";
		termWs = ws;
		ws.onopen = () => {
			termState("подключено", true);
			term.focus();
		};
		ws.onmessage = (e) => term.write(new Uint8Array(e.data));
		ws.onclose = () => {
			if (termWs !== ws) return;
			termWs = null;
			termState("закрыт");
			term.write("\r\n\x1B[90m[сеанс закрыт — Enter, чтобы открыть новый]\x1B[0m\r\n");
		};
	}
	$("#term-new").onclick = () => {
		if (termWs) {
			const old = termWs;
			termWs = null;
			old.close();
		}
		termInit() && term.reset();
		termConnect();
	};
	const termKeys = {
		esc: "\x1B",
		tab: "	",
		up: "\x1B[A",
		down: "\x1B[B",
		left: "\x1B[D",
		right: "\x1B[C",
		interrupt: "",
		eof: ""
	};
	listen($(".term-keys"), "pointerdown", (e) => {
		if (e.target.closest("[data-term-key]")) e.preventDefault();
	});
	listen($(".term-keys"), "click", (e) => {
		const d = termKeys[e.target.closest("[data-term-key]")?.dataset.termKey];
		if (d && termWs?.readyState === 1) termWs.send(JSON.stringify({
			t: "i",
			d
		}));
	});
	if (window.visualViewport) {
		const fitMobile = () => $("#tab-console").style.setProperty("--visual-height", window.visualViewport.height + "px");
		listen(window.visualViewport, "resize", fitMobile);
		fitMobile();
	}
	const store = {
		get: (k) => {
			try {
				return localStorage.getItem(PanelContext.storageKey(k));
			} catch {
				return null;
			}
		},
		set: (k, v) => {
			try {
				localStorage.setItem(PanelContext.storageKey(k), v);
			} catch {}
		}
	};
	let bootLoaded = false;
	let logsLoaded = false;
	let shownTab = null;
	function showTab() {
		const tab = context.active();
		shownTab = tab;
		if (!online) {
			if (tab === "settings") {
				loadAccess();
				loadPanelVersion().catch(() => {});
				loadPanelModel();
			}
			return;
		}
		if (tab === "files" && !fs.loaded) fsOpen(store.get("fs.cwd") || "/data/quasar");
		if (tab === "logs" && !logsLoaded) {
			logsLoaded = true;
			api("/api/logs").then((l) => {
				$("#log-name").innerHTML = l.map((n) => `<option ${n === "maind.log" ? "selected" : ""}>${esc(n)}</option>`).join("");
				loadLog();
			}).catch((e) => toast(e.message, true));
		}
		if (tab === "console") setTimeout(() => {
			termConnect();
			try {
				termFit?.fit();
			} catch {}
			term?.focus();
		}, 0);
		if (tab === "boot" && !bootLoaded) {
			bootLoaded = true;
			loadBoot();
		}
		if (tab === "alarm") loadAlarms();
		if (tab === "charts") loadCharts();
		if (tab === "settings") {
			loadAccess();
			loadFootprint();
			loadPanelVersion().catch(() => {});
			loadPanelModel();
		}
		if (tab === "overview") loadBt();
		if (tab === "player") {
			renderMusic();
			loadPlayerExtras();
			loadMusic();
		}
		updateMinibar();
	}
	const mu = {
		info: null,
		seeking: false,
		volSet: 0,
		qr: null,
		qrTimer: null,
		trackId: null,
		track: null,
		extras: {}
	};
	const fmtDur = (s) => {
		s = Math.max(0, Math.floor(s || 0));
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
	};
	const muState = () => mu.info?.glagol?.state;
	const muPlayer = () => muState()?.playerState;
	const muHas = () => {
		const p = muPlayer();
		return !!(p && (p.title || p.subtitle));
	};
	const minibarOn = () => store.get("ui.minibar") !== "0";
	const coverUrl = (uri, size) => uri ? uri.includes("://") ? uri : "https://" + uri.replace("%%", `${size}x${size}`) : "";
	const muCmd = (btn, payload, msg) => act(btn, async () => {
		const r = await api("/api/music/cmd", payload);
		if (r.status && r.status !== "SUCCESS" && r.status !== "timeout") throw new Error("Колонка ответила: " + r.status);
		setTimeout(loadMusic, 300);
	}, msg);
	const MU_BTNS = {
		dislike: [
			"i-dislike",
			18,
			"Дизлайк"
		],
		shuffle: [
			"i-shuffle",
			18,
			"Перемешать"
		],
		prev: [
			"i-prev",
			20,
			"Предыдущий"
		],
		play: [
			"i-play",
			24,
			"Играть"
		],
		next: [
			"i-next",
			20,
			"Следующий"
		],
		repeat: [
			"i-repeat",
			18,
			"Повтор"
		],
		like: [
			"i-like",
			18,
			"Лайк"
		]
	};
	$$("[data-mu-controls]").forEach((el) => {
		el.innerHTML = (el.dataset.muControls === "bar" ? [
			"shuffle",
			"prev",
			"play",
			"next",
			"repeat"
		] : Object.keys(MU_BTNS)).map((k) => `<button class="cbtn${k === "play" ? " big" : ""}" data-mu="${k}" aria-label="${MU_BTNS[k][2]}">${icon(MU_BTNS[k][0], MU_BTNS[k][1])}</button>`).join("");
	});
	function updateMinibar() {
		const show = online && minibarOn() && !!mu.info?.auth?.logged_in && $("#tab-player").hidden;
		$("#minibar").hidden = !show;
		document.body.classList.toggle("has-minibar", show);
	}
	async function loadMusic() {
		const need = !$("#tab-overview").hidden || !$("#tab-player").hidden || minibarOn() && mu.info?.auth?.logged_in !== false;
		if (document.hidden || !online || !need) return;
		try {
			mu.info = await api("/api/music");
		} catch {
			return;
		}
		renderMusic();
	}
	setInterval(loadMusic, 1e3);
	function musicPos() {
		const s = muState(), p = s?.playerState;
		if (!p) return 0;
		const since = s.playing ? Date.now() / 1e3 - (mu.info.glagol.progress_at || mu.info.glagol.updated) : 0;
		return Math.min(p.duration || Infinity, (p.progress || 0) + Math.max(0, since));
	}
	const YM = "https://music.yandex.ru";
	const ymA = (path, text, cls = "") => `<a class="ym${cls ? " " + cls : ""}" href="${YM}${esc(path)}" target="_blank" rel="noopener" title="Открыть в Яндекс Музыке">${esc(text)}</a>`;
	const ymTrackPath = (t) => t.album?.id ? `/album/${t.album.id}/track/${t.id}` : `/track/${t.id}`;
	function ymSourcePath(p) {
		const id = String(p?.playlistId || "");
		if (!id || id === "user:onyourwave") return null;
		if (p.playlistType === "Album") return `/album/${id}`;
		if (p.playlistType === "Artist") return `/artist/${id}`;
		if (p.playlistType === "Playlist") {
			const [owner, kind] = id.includes(":") ? id.split(":") : [p.playlistPuid, id];
			return owner && kind ? `/users/${owner}/playlists/${kind}` : null;
		}
		return null;
	}
	const setHtml = (e, html) => {
		if (e._html !== html) {
			e._html = html;
			e.innerHTML = html;
		}
	};
	function renderMusic() {
		const i = mu.info;
		if (!i) return;
		const logged = i.auth.logged_in;
		updateMinibar();
		$("#mu-login").hidden = logged;
		$("#mu-player").hidden = !logged;
		$("#mu-logout").hidden = !logged;
		ymLogin = logged ? i.auth.login || "" : "";
		$("#mu-account").innerHTML = ymLogin ? secret("login", ymLogin) : "";
		$("#pl-login").hidden = logged;
		$("#pl-body").hidden = !logged;
		if (!logged) {
			if (!mu.qr && !$("#tab-overview").hidden) startQr();
			return;
		}
		stopQr();
		const g = i.glagol, s = g.state, p = s?.playerState, has = muHas();
		const isBt = p?.playerType === "bluetooth";
		document.body.classList.toggle("mu-bt", isBt);
		$("#mu-err").hidden = g.connected;
		$("#mu-err").textContent = g.connected ? "" : g.error || "Подключаемся к колонке…";
		const title = has ? p.title : "Ничего не играет";
		const artist = has ? (p.subtitle || "") + (isBt && p.extra?.album ? " — " + p.extra.album : "") : g.connected ? "Нажмите ▶ — включится «Моя волна»" : "";
		const t = !isBt && mu.track && mu.track.id === String(p?.id) ? mu.track : null;
		$$(".mu-title").forEach((e) => {
			if (t && e.closest("#music-card, #tab-player")) setHtml(e, ymA(ymTrackPath(t), title));
			else setHtml(e, esc(title));
		});
		$$(".mu-artist").forEach((e) => {
			if (t?.artistList?.length && e.closest("#music-card, #tab-player")) setHtml(e, t.artistList.map((a) => ymA(`/artist/${a.id}`, a.name)).join(", "));
			else setHtml(e, esc(artist));
		});
		const cover = has && !isBt ? coverUrl(p.extra?.coverURI, 400) : "";
		$$(".mu-cover").forEach((e) => {
			const url = e.classList.contains("pl-cover") && mu.track?.coverBig ? mu.track.coverBig : cover;
			e.style.backgroundImage = url ? `url("${url}")` : "";
			if (e.firstElementChild) e.firstElementChild.style.display = url ? "none" : "";
		});
		const playing = !!s?.playing, rep = p?.entityInfo?.repeatMode || "None";
		$$("[data-mu=\"play\"]").forEach((b) => {
			b.innerHTML = icon(playing ? "i-pause" : "i-play", 24);
			b.setAttribute("aria-label", playing ? "Пауза" : "Играть");
		});
		$$("[data-mu=\"prev\"]").forEach((b) => b.disabled = !p?.hasPrev);
		$$("[data-mu=\"next\"]").forEach((b) => b.disabled = !p?.hasNext);
		$$("[data-mu=\"repeat\"]").forEach((b) => {
			b.classList.toggle("on", rep !== "None");
			b.innerHTML = icon("i-repeat", 18) + (rep === "One" ? "<span class=\"one\">1</span>" : "");
			b.setAttribute("aria-label", {
				None: "Повтор выключен",
				All: "Повтор всех",
				One: "Повтор трека"
			}[rep]);
		});
		$$("[data-mu=\"shuffle\"]").forEach((b) => b.classList.toggle("on", !!p?.entityInfo?.shuffled));
		$$("[data-mu=\"like\"]").forEach((b) => {
			b.classList.toggle("liked", !!mu.track?.liked);
			b.setAttribute("aria-label", mu.track?.liked ? "Убрать лайк" : "Лайк");
		});
		$$("[data-mu=\"shuffle\"], [data-mu=\"repeat\"], [data-mu=\"like\"], [data-mu=\"dislike\"]").forEach((b) => b.disabled = !has);
		const pos = musicPos();
		$$("input.mu-seek").forEach((r) => {
			r.disabled = !p?.duration || isBt;
			r.title = isBt ? "По Bluetooth перематывать можно только на телефоне" : "";
			if (!mu.seeking) {
				r.max = Math.round(p?.duration || 100);
				r.value = Math.round(pos);
			}
		});
		if (!mu.seeking) $$(".mu-pos").forEach((e) => e.textContent = fmtDur(pos));
		$$(".mu-dur").forEach((e) => e.textContent = fmtDur(p?.duration));
		if (typeof s?.volume === "number" && Date.now() - mu.volSet > 2500) {
			$$("input.mu-vol").forEach((r) => r.value = Math.round(s.volume * 100));
			$$(".mu-vol-v").forEach((e) => e.textContent = Math.round(s.volume * 100));
		}
		if (p?.id && p.id !== mu.trackId) {
			mu.trackId = p.id;
			mu.track = null;
			mu.extras = {};
			if (!isBt) api("/api/music/info?id=" + encodeURIComponent(p.id)).then((t) => {
				if (mu.trackId === p.id) {
					mu.track = t;
					renderMusic();
				}
			}).catch(() => {});
			if (!$("#tab-player").hidden) loadPlayerExtras();
		}
		if (!$("#tab-player").hidden) renderPlayerTab();
	}
	setInterval(() => muState()?.playing && !mu.seeking && renderMusic(), 250);
	const PL_TYPES = {
		Radio: "Радио",
		Album: "Альбом",
		Playlist: "Плейлист",
		Artist: "Исполнитель",
		Track: "Трек",
		FmRadio: "FM-радио"
	};
	function renderPlayerTab() {
		const s = muState(), p = muPlayer(), t = mu.track;
		const src = mu.extras.queue?.title || (p?.playlistId === "user:onyourwave" ? "Моя волна" : p?.playlistDescription);
		const isBt = p?.playerType === "bluetooth";
		const srcPath = !isBt && muHas() ? ymSourcePath(p) : null;
		setHtml($("#pl-source"), isBt ? "Bluetooth · звук с телефона или компьютера" : muHas() ? esc(PL_TYPES[p.playlistType] || p.playlistType || "") + (src ? " · " + (srcPath ? ymA(srcPath, src) : esc(src)) : "") : "Ничего не играет");
		$("#pl-kind").textContent = p ? (isBt ? "Bluetooth" : PL_TYPES[p.type] || p.type || "Трек") + (s?.playing ? " · играет" : " · пауза") : "—";
		const meta = [];
		if (t) {
			if (t.album?.title) meta.push(t.album.id ? ymA(`/album/${t.album.id}`, `Альбом «${t.album.title}»`, "badge") : `<span class="badge">${esc(`Альбом «${t.album.title}»`)}</span>`);
			for (const m of [
				t.album?.year,
				t.album?.genre,
				t.album?.label,
				t.album?.trackCount && `${t.album.trackCount} треков в альбоме`,
				t.explicit && "18+"
			]) if (m) meta.push(`<span class="badge">${esc(m)}</span>`);
		}
		setHtml($("#pl-meta"), meta.join(""));
		const ly = mu.extras.lyrics;
		if (ly?.sync) {
			const pos = musicPos(), idx = ly.sync.reduce((k, l, j) => l[0] <= pos ? j : k, -1);
			if (idx !== mu.extras.lyIdx) {
				mu.extras.lyIdx = idx;
				$$("#pl-lyrics .ln").forEach((el, j) => el.classList.toggle("cur", j === idx));
				const box = $("#pl-lyrics"), line = $(`#pl-lyrics .ln:nth-child(${idx + 1})`);
				if (line && Date.now() - (box._userScroll || 0) > 6e3) {
					box._auto = Date.now();
					box.scrollTo({
						top: line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2,
						behavior: "smooth"
					});
				}
			}
		}
		if ($("#pl-raw-box").open) renderRaw();
	}
	function renderRaw() {
		const out = [], walk = (o, pre) => Object.entries(o || {}).forEach(([k, v]) => v && typeof v === "object" && !Array.isArray(v) ? walk(v, pre + k + ".") : out.push([pre + k, Array.isArray(v) ? `[${v.length}]` : String(v)]));
		walk(muState(), "");
		$("#pl-raw").innerHTML = out.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v.length > 140 ? v.slice(0, 140) + "…" : v)}</dd>`).join("");
	}
	$("#pl-raw-box").addEventListener("toggle", renderRaw);
	[
		"wheel",
		"touchmove",
		"pointerdown"
	].forEach((ev) => $("#pl-lyrics").addEventListener(ev, () => {
		$("#pl-lyrics")._userScroll = Date.now();
	}, { passive: true }));
	const trackRow = (t, cur, tag) => `<button class="trow${cur ? " cur" : ""}" data-play="${esc(t.id)}" ${t.available === false ? "disabled" : ""}>
  ${t.cover ? `<img src="${esc(t.cover)}" alt="" loading="lazy">` : "<span class=\"ph\"></span>"}
  <span class="tt"><b>${esc(t.title)}</b><span>${esc(t.artists)}</span></span>
  ${tag ? `<span class="badge${cur ? " ok" : ""}">${tag}</span>` : ""}<span class="td">${t.durationMs ? fmtDur(t.durationMs / 1e3) : ""}</span></button>`;
	async function loadPlayerExtras() {
		const id = mu.trackId;
		if (!id || mu.extras.for === id) return;
		mu.extras = { for: id };
		$("#pl-lyrics").innerHTML = $("#pl-queue").innerHTML = $("#pl-similar").innerHTML = "<div class=\"empty\">Загрузка…</div>";
		const p = muPlayer(), isBt = p?.playerType === "bluetooth";
		const lyUrl = isBt ? "/api/music/lyrics?" + new URLSearchParams({
			title: p.title || "",
			artist: p.subtitle || "",
			album: p.extra?.album || "",
			duration: p.duration || 0
		}) : "/api/music/lyrics?id=" + id;
		const none = Promise.reject(/* @__PURE__ */ new Error("—"));
		none.catch(() => {});
		const [ly, q, sim] = await Promise.allSettled([
			api(lyUrl),
			isBt ? none : api("/api/music/queue"),
			isBt ? none : api("/api/music/similar?id=" + id)
		]);
		if (mu.trackId !== id) return;
		const L = ly.status === "fulfilled" ? ly.value : {};
		if (L.text) {
			mu.extras.lyrics = L;
			$("#pl-lyrics").innerHTML = L.sync ? L.sync.map((l) => `<span class="ln">${esc(l[1]) || "&nbsp;"}</span>`).join("") : esc(L.text);
			$("#pl-ly-meta").textContent = L.sync ? "идёт вместе с песней" : "";
		} else {
			$("#pl-lyrics").innerHTML = `<div class="empty">${L.instrumental ? "Инструментальный трек — без слов" : "Текст не нашёлся ни в Яндекс Музыке, ни в LRCLIB"}</div>`;
			$("#pl-ly-meta").textContent = "";
		}
		const SRC = {
			"Яндекс Музыка": "Текст: Яндекс Музыка",
			"LRCLIB": "Текст: <a href=\"https://lrclib.net\" target=\"_blank\" rel=\"noopener\">LRCLIB</a> — открытая база текстов песен"
		};
		$("#pl-ly-src").hidden = !L.source;
		$("#pl-ly-src").innerHTML = SRC[L.source] || "";
		if (q.status === "fulfilled") {
			mu.extras.queue = q.value;
			$("#pl-q-title").textContent = q.value.title ? `Очередь · ${q.value.title}` : "Очередь";
			$("#pl-q-count").textContent = q.value.tracks.length > 3 ? `${q.value.tracks.length} треков` : "";
			const cur = q.value.current, tagOf = (k) => cur == null ? "" : k === cur ? "сейчас" : k === cur + 1 ? "далее" : k === cur - 1 ? "было" : "";
			$("#pl-queue").innerHTML = q.value.tracks.map((t, k) => trackRow(t, k === cur, tagOf(k))).join("") || "<div class=\"empty\">Пусто</div>";
			$("#pl-queue .trow.cur")?.scrollIntoView({ block: "nearest" });
		} else $("#pl-queue").innerHTML = `<div class="empty">${esc(q.reason?.message || "Не удалось")}</div>`;
		$("#pl-similar").innerHTML = sim.status === "fulfilled" && sim.value.length ? sim.value.map((t) => trackRow(t)).join("") : "<div class=\"empty\">Нет</div>";
		if (isBt) return;
		const waitTrack = async () => {
			for (let k = 0; k < 20 && !mu.track && mu.trackId === id; k++) await new Promise((r) => setTimeout(r, 300));
		};
		await waitTrack();
		const aid = mu.track?.artistList?.[0]?.id;
		if (!aid) {
			$("#pl-artist").innerHTML = "<div class=\"empty\">—</div>";
			return;
		}
		try {
			const a = await api("/api/music/artist?id=" + aid);
			if (mu.trackId !== id) return;
			$("#pl-artist").innerHTML = `<div class="artist-grid">
      ${a.cover ? `<img src="${esc(a.cover)}" alt="">` : "<span></span>"}
      <div class="col" style="gap:8px">
        <div style="font-size:22px;font-weight:800">${ymA(`/artist/${a.id}`, a.name)}</div>
        <div class="pl-meta">${(a.genres || []).map((g) => `<span class="badge">${esc(g)}</span>`).join("")}
          ${a.likes ? `<span class="badge">♥ ${a.likes.toLocaleString("ru")}</span>` : ""}
          ${a.tracks ? `<span class="badge">${a.tracks} треков</span>` : ""}${a.albums ? `<span class="badge">${a.albums} альбомов</span>` : ""}</div>
        ${a.description ? `<p class="hint" style="font-size:14px">${esc(a.description)}</p>` : ""}
        ${a.similar?.length ? `<div class="meta">Похожие: ${a.similar.map((x) => x.id ? ymA(`/artist/${x.id}`, x.name) : esc(x.name)).join(", ")}</div>` : ""}
        <div><a class="btn sm" href="${YM}/artist/${esc(a.id)}" target="_blank" rel="noopener">Открыть в Яндекс Музыке ↗</a></div>
        ${a.popular?.length ? `<b style="margin-top:6px">Популярное</b><div class="tlist">${a.popular.map((t) => trackRow(t)).join("")}</div>` : ""}
      </div></div>`;
		} catch (e) {
			$("#pl-artist").innerHTML = `<div class="empty">${esc(e.message)}</div>`;
		}
	}
	function musicAction(a, btn) {
		const s = muState(), p = muPlayer();
		if (a === "play") {
			if (s?.playing) return muCmd(btn, { command: "stop" });
			if (!muHas()) return muCmd(btn, {
				command: "sendText",
				text: "Включи мою волну"
			}, "Включаю «Мою волну»");
			return muCmd(btn, { command: "play" });
		}
		if (a === "prev" || a === "next") return muCmd(btn, { command: a });
		if (a === "shuffle") return muCmd(btn, {
			command: "shuffle",
			enable: !p?.entityInfo?.shuffled
		});
		if (a === "repeat") return muCmd(btn, {
			command: "repeat",
			mode: {
				None: "All",
				All: "One",
				One: "None"
			}[p?.entityInfo?.repeatMode || "None"]
		});
		if (!p?.id) return;
		if (a === "like") return act(btn, async () => {
			const r = await api("/api/music/like", {
				id: p.id,
				like: !mu.track?.liked
			});
			if (mu.track) mu.track.liked = r.liked;
			renderMusic();
			toast(r.liked ? "♥ В «Мне нравится»" : "Лайк убран");
		});
		if (a === "dislike") return act(btn, () => api("/api/music/dislike", { id: p.id }), "Дизлайк — дальше");
	}
	let coverStart;
	const touchCover = $(".pl-cover");
	listen(touchCover, "pointerdown", (e) => {
		if (e.pointerType === "touch" && e.isPrimary) {
			coverStart = {
				id: e.pointerId,
				x: e.clientX,
				y: e.clientY
			};
			touchCover.setPointerCapture(e.pointerId);
		}
	});
	listen(touchCover, "pointercancel", () => {
		coverStart = void 0;
	});
	listen(touchCover, "pointerup", (e) => {
		if (coverStart?.id !== e.pointerId) return;
		const dx = e.clientX - coverStart.x, dy = e.clientY - coverStart.y;
		coverStart = void 0;
		if (!muHas()) return;
		const action = Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5 ? dx < 0 ? "next" : "prev" : Math.hypot(dx, dy) < 12 ? "play" : null;
		const button = action && $("#tab-player [data-mu=\"" + action + "\"]");
		if (button && !button.disabled) button.click();
	});
	listen(document, "click", (e) => {
		const b = e.target.closest("[data-mu]");
		if (b) return musicAction(b.dataset.mu, b);
		const r = e.target.closest("[data-play]");
		if (r) act(r, () => api("/api/music/play", {
			id: r.dataset.play,
			type: "track"
		}), "Включаю");
	});
	listen(document, "input", (e) => {
		if (e.target.matches("input.mu-seek")) {
			mu.seeking = true;
			$$(".mu-pos").forEach((x) => x.textContent = fmtDur(+e.target.value));
		}
		if (e.target.matches("input.mu-vol")) {
			mu.volSet = Date.now();
			$$(".mu-vol-v").forEach((x) => x.textContent = e.target.value);
		}
	});
	listen(document, "change", (e) => {
		if (e.target.matches("input.mu-seek")) muCmd(null, {
			command: "rewind",
			position: +e.target.value
		}).finally(() => setTimeout(() => mu.seeking = false, 800));
		if (e.target.matches("input.mu-vol")) {
			mu.volSet = Date.now();
			act(null, () => api("/api/volume", { level: +e.target.value }));
		}
	});
	listen(document, "submit", (e) => {
		if (!e.target.matches(".mu-ask-form")) return;
		e.preventDefault();
		const input = e.target.elements.text, text = input.value.trim();
		if (!text) return;
		muCmd(e.submitter, {
			command: "sendText",
			text
		}, "Алиса: «" + text + "»").then(() => input.value = "");
	});
	$("#mu-logout").onclick = (e) => confirm("Выйти из аккаунта Яндекса? Токен будет удалён с этого компьютера.") && act(e.currentTarget, async () => {
		await api("/api/auth/logout", {});
		mu.qr = null;
		await loadMusic();
	}, "Вы вышли из аккаунта");
	async function startQr() {
		mu.qr = "pending";
		$("#mu-qr").innerHTML = "<div class=\"empty\">QR-код…</div>";
		$("#mu-qr-status").textContent = "";
		try {
			const [r, a] = await Promise.all([api("/api/auth/qr", {}), api("/api/auth")]);
			mu.qr = r.link;
			$("#mu-oauth").href = a.oauth_url;
			const q = qrcode(0, "M");
			q.addData(r.link);
			q.make();
			$("#mu-qr").innerHTML = q.createSvgTag({
				cellSize: 4,
				margin: 0,
				scalable: true
			});
			$("#mu-qr-status").textContent = "Ждём подтверждения на телефоне…";
			clearInterval(mu.qrTimer);
			mu.qrTimer = setInterval(pollQr, 2e3);
		} catch (e) {
			mu.qr = "failed";
			$("#mu-qr").innerHTML = "<div class=\"empty\">QR недоступен</div>";
			$("#mu-qr-status").textContent = e.offline ? "" : e.message + " — войдите через Яндекс ниже.";
			api("/api/auth").then((a) => $("#mu-oauth").href = a.oauth_url).catch(() => {});
		}
	}
	function stopQr() {
		clearInterval(mu.qrTimer);
		mu.qrTimer = null;
		mu.qr = null;
	}
	async function pollQr() {
		try {
			const r = await api("/api/auth/qr");
			if (r.state === "done") {
				stopQr();
				toast("Вход выполнен" + (r.login ? ": " + r.login : ""));
				loadMusic();
			} else if (r.state === "expired" || r.state === "none") {
				clearInterval(mu.qrTimer);
				$("#mu-qr-status").innerHTML = "QR-код устарел. <button class=\"btn sm\" id=\"mu-qr-new\">Новый код</button>";
				$("#mu-qr-new").onclick = () => startQr();
			}
		} catch (e) {
			if (!e.offline) $("#mu-qr-status").textContent = e.message;
		}
	}
	$("#mu-oauth-go").onclick = (e) => act(e.currentTarget, async () => {
		const r = await api("/api/auth/oauth", { url: $("#mu-oauth-url").value });
		$("#mu-oauth-url").value = "";
		stopQr();
		await loadMusic();
		return r;
	}, "Вход выполнен");
	(() => {
		const cv = $("#model-viz"), ctx = cv.getContext("2d");
		const RAMP = " .·:-=+*%#@", FS = 13;
		let cw = 0, ch = 0, energy = 0, last = 0, color = "#6C47FF";
		const sb = [
			0,
			0,
			0,
			0
		];
		const reduced = matchMedia("(prefers-reduced-motion: reduce)");
		const readColor = () => {
			color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || color;
		};
		readColor();
		listen(matchMedia("(prefers-color-scheme: dark)"), "change", readColor);
		listen(window, "themechange", readColor);
		new ResizeObserver(() => {
			const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
			cw = r.width;
			ch = r.height;
			cv.width = Math.round(cw * dpr);
			cv.height = Math.round(ch * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}).observe(cv);
		function frame(now) {
			requestAnimationFrame(frame);
			if (document.hidden || !cv.offsetParent || !cw || now - last < 33) return;
			last = now;
			if (window.__vizOff) {
				if (energy) {
					ctx.clearRect(0, 0, cw, ch);
					energy = 0;
				}
				return;
			}
			const t = now / 1e3;
			const idle = window.__vizIdleOff ? 0 : 1 - energy, ti = reduced.matches ? 0 : t;
			const playing = !!mu.info?.glagol?.state?.playing;
			energy += ((playing ? 1 : .12) - energy) * .05;
			const beat = Math.exp(-(t * 2 % 1) * 5);
			const sp = window.__spectrum, live = !!sp && now - sp.t < 700;
			if (live) sp.bands.forEach((b, k) => {
				sb[k] += (b - sb[k]) * .35;
			});
			else sb.forEach((_, k) => {
				sb[k] *= .9;
			});
			const loud = (sb[0] + sb[1] + sb[2] + sb[3]) / 4;
			const pulse = live ? .45 + .75 * loud : .55 + .45 * beat;
			ctx.clearRect(0, 0, cw, ch);
			if (energy < .02 && idle < .02) return;
			ctx.font = `${FS}px 'JetBrains Mono', monospace`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = color;
			const cx = cw / 2, cy = ch / 2, colW = FS * .62, rowH = FS * 1.1, maxR = Math.hypot(cx, cy), idleR = Math.min(cw, ch) * .75;
			for (let y = rowH / 2; y < ch; y += rowH) for (let x = colW / 2; x < cw; x += colW) {
				const dx = x - cx, dy = y - cy;
				const r = Math.hypot(dx, dy) / maxR, a = Math.atan2(dy, dx);
				let amp;
				if (live) {
					const u = Math.abs(a) / Math.PI * 3, k = Math.min(2, Math.floor(u)), f = u - k;
					amp = .2 + .95 * (sb[k] * (1 - f) + sb[k + 1] * f) + .06 * Math.sin(a * 9 + t * 2);
				} else amp = .4 + .22 * Math.sin(a * 3 + t * 1.3) + .18 * Math.sin(a * 7 - t * 2.1) + .12 * Math.sin(a * 13 + t * 3.7);
				const reach = (.42 + .5 * amp * pulse) * energy;
				let v = r < reach ? 1 - (r / reach) ** 2 : 0;
				v = Math.max(v, Math.max(0, Math.sin(r * 16 - t * 3.4)) ** 3 * .5 * energy * (1 - r));
				if (idle) {
					const wave = .78 + .12 * Math.sin(a * 3 + ti * .8) + .07 * Math.sin(a * 7 - ti);
					v = Math.max(v, Math.max(0, 1 - (Math.hypot(dx, dy) / idleR / wave) ** 2) * .45 * idle);
				}
				if (v < .08) continue;
				ctx.globalAlpha = Math.min(.8, v * .85);
				ctx.fillText(RAMP[Math.min(10, Math.floor(v * 11))], x, y);
			}
			ctx.globalAlpha = 1;
		}
		requestAnimationFrame(frame);
	})();
	const fs = {
		cwd: "/",
		entries: [],
		writable: false,
		sort: "name",
		dir: 1,
		sel: null,
		loaded: false
	};
	const AUDIO = /\.(wav|mp3|opus|ogg|oga|flac|m4a|aac)$/i;
	const join = (dir, name) => (dir === "/" ? "" : dir) + "/" + name;
	const parent = (p) => p.replace(/\/[^/]*$/, "") || "/";
	function fmtSize(n) {
		if (n < 1024) return n + " Б";
		const u = [
			"КБ",
			"МБ",
			"ГБ"
		];
		let i = -1;
		do {
			n /= 1024;
			i++;
		} while (n >= 1024 && i < u.length - 1);
		return n.toFixed(n < 10 ? 1 : 0) + " " + u[i];
	}
	function fmtTime(t) {
		if (!t) return "—";
		const d = /* @__PURE__ */ new Date(t * 1e3), p = (x) => String(x).padStart(2, "0");
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
	}
	async function fsOpen(path, keepSel = false) {
		try {
			const r = await api("/api/fs/list?path=" + encodeURIComponent(path));
			Object.assign(fs, {
				cwd: r.path,
				entries: r.entries,
				writable: r.writable,
				loaded: true
			});
			if (!keepSel) fs.sel = null;
			store.set("fs.cwd", r.path);
			$("#fs-filter").value = keepSel ? $("#fs-filter").value : "";
			renderCrumbs();
			renderFs();
		} catch (e) {
			toast(e.message, true);
			if (!fs.loaded && path !== "/") fsOpen("/");
		}
	}
	function renderCrumbs() {
		const parts = fs.cwd.split("/").filter(Boolean);
		let acc = "";
		$("#fs-crumbs").innerHTML = "<a data-p=\"/\">/</a>" + parts.map((p, i) => {
			acc += "/" + p;
			return (i ? "<span>/</span>" : "") + `<a data-p="${esc(acc)}">${esc(p)}</a>`;
		}).join("");
		$$("#fs-crumbs a").forEach((a) => a.onclick = () => fsOpen(a.dataset.p));
		const rw = $("#fs-rw");
		rw.textContent = fs.writable ? "запись" : "только чтение";
		rw.className = "badge" + (fs.writable ? " ok" : "");
		[
			"#fs-upload",
			"#fs-mkdir",
			"#fs-newfile"
		].forEach((s) => $(s).disabled = !fs.writable);
	}
	function renderFs() {
		const f = $("#fs-filter").value.toLowerCase(), hidden = $("#fs-hidden").checked;
		const list = fs.entries.filter((e) => (hidden || !e.name.startsWith(".")) && (!f || e.name.toLowerCase().includes(f))).sort((a, b) => b.is_dir - a.is_dir || fs.dir * (fs.sort === "name" ? a.name.localeCompare(b.name, "ru", { numeric: true }) : a[fs.sort] - b[fs.sort]));
		$$("table.fs th[data-sort]").forEach((th) => {
			th.textContent = th.textContent.replace(/ [▲▼]$/, "") + (th.dataset.sort === fs.sort ? fs.dir > 0 ? " ▲" : " ▼" : "");
		});
		const body = $("#fs-body");
		if (!list.length) {
			body.innerHTML = `<tr><td colspan="5"><div class="empty">${fs.entries.length ? "Ничего не найдено" : "Пустая папка"}</div></td></tr>`;
			return;
		}
		body.innerHTML = list.map((e) => {
			const ico = e.is_dir ? "i-folder" : e.type === "link" ? "i-link" : AUDIO.test(e.name) ? "i-music" : "i-file";
			return `<tr data-name="${esc(e.name)}" class="${e.is_dir ? "dir" : ""} ${fs.sel === e.name ? "sel" : ""}">
      <td class="name"><span class="n">${icon(ico, 18)}${esc(e.name)}</span>${e.target ? ` <span class="tgt">→ ${esc(e.target)}</span>` : ""}</td>
      <td class="num">${e.is_dir ? "" : fmtSize(e.size)}</td>
      <td class="dim hide-sm">${fmtTime(e.mtime)}</td>
      <td class="dim hide-sm">${esc(e.mode)}</td>
      <td class="act">
        <button class="btn sm icon ghost" data-a="dl" aria-label="Скачать${e.is_dir ? " архивом" : ""}" title="Скачать${e.is_dir ? " (.tar.gz)" : ""}">${icon("i-dl")}</button>
        ${fs.writable ? `<button class="btn sm icon ghost" data-a="mv" aria-label="Переименовать" title="Переименовать">${icon("i-edit")}</button>
        <button class="btn sm icon ghost danger" data-a="rm" aria-label="Удалить" title="Удалить">${icon("i-trash")}</button>` : ""}
      </td></tr>`;
		}).join("");
		$$("#fs-body tr[data-name]").forEach((tr) => {
			const e = fs.entries.find((x) => x.name === tr.dataset.name);
			tr.onclick = (ev) => {
				const a = ev.target.closest("button")?.dataset.a;
				if (a) return fsAction(a, e);
				if (e.is_dir) return fsOpen(join(fs.cwd, e.name));
				fs.sel = e.name;
				renderFs();
				fsPreview(e);
			};
		});
	}
	async function fsAction(a, e) {
		const p = join(fs.cwd, e.name);
		if (a === "dl") {
			toast(e.is_dir ? "Упаковка папки…" : "Скачивание…");
			const link = document.createElement("a");
			link.href = PanelContext.url("/api/fs/download?path=" + encodeURIComponent(p));
			link.download = "";
			document.body.append(link);
			link.click();
			link.remove();
		} else if (a === "mv") {
			const name = prompt("Новое имя", e.name);
			if (!name || name === e.name) return;
			if (await act(null, () => api("/api/fs/rename", {
				path: p,
				name
			}), "Переименовано")) {
				if (fs.sel === e.name) fs.sel = name;
				fsOpen(fs.cwd, true);
			}
		} else if (a === "rm") {
			if (!confirm(`Удалить ${e.is_dir ? "папку со всем содержимым" : "файл"}\n${p}?`)) return;
			if (await act(null, () => api("/api/fs/delete", { path: p }), "Удалено")) {
				if (fs.sel === e.name) clearPreview();
				fsOpen(fs.cwd, true);
			}
		}
	}
	function clearPreview() {
		fs.sel = null;
		$("#fs-preview").innerHTML = "<h2>Просмотр</h2><div class=\"empty\">Выберите файл</div>";
	}
	async function fsPreview(e, isNew = false) {
		const p = join(fs.cwd, e.name), pv = $("#fs-preview");
		pv.innerHTML = `<h2>Просмотр</h2><div class="pv-name">${esc(p)}</div>
    <div class="row" id="pv-actions" style="gap:8px"></div><div id="pv-body"><div class="empty">Загрузка…</div></div>`;
		const actions = $("#pv-actions");
		const addBtn = (html, fn, cls = "") => {
			const b = document.createElement("button");
			b.innerHTML = html;
			b.className = "btn sm " + cls;
			b.onclick = () => fn(b);
			actions.append(b);
			return b;
		};
		if (!isNew) addBtn(icon("i-dl", 14) + "Скачать", () => fsAction("dl", e));
		if (AUDIO.test(e.name)) {
			addBtn(icon("i-play", 14) + "Играть на колонке", (b) => act(b, () => api("/api/fs/play", { path: p }), "▶ " + e.name), "primary");
			addBtn(icon("i-stop", 14) + "Стоп", (b) => act(b, () => api("/api/stop", {})), "danger-soft");
			$("#pv-body").innerHTML = `<p class="hint">${fmtSize(e.size)} · ${fmtTime(e.mtime)}</p>`;
			return;
		}
		let r = {
			text: "",
			binary: false,
			truncated: false
		};
		if (!isNew) {
			try {
				r = await api("/api/fs/read?path=" + encodeURIComponent(p));
			} catch (err) {
				$("#pv-body").innerHTML = `<div class="empty">${esc(err.message)}</div>`;
				return;
			}
			if (fs.sel !== e.name) return;
		}
		const body = $("#pv-body");
		if (r.binary) {
			body.innerHTML = `<p class="hint" style="margin-bottom:8px">Бинарный файл, ${fmtSize(e.size)}. Первые 4 КБ:</p><pre class="out"></pre>`;
			body.querySelector("pre").textContent = r.text;
			return;
		}
		const editable = fs.writable && !r.truncated;
		body.innerHTML = `<textarea spellcheck="false" aria-label="Содержимое файла" ${editable ? "" : "readonly"}></textarea>
    ${r.truncated ? "<p class=\"hint\">Показаны первые 512 КБ — редактирование отключено.</p>" : ""}
    ${!fs.writable ? "<p class=\"hint\">Папка только для чтения.</p>" : ""}`;
		const ta = body.querySelector("textarea");
		ta.value = r.text;
		if (editable) {
			const save = addBtn("Сохранить", (b) => act(b, async () => {
				await api("/api/fs/write", {
					path: p,
					text: ta.value
				});
				save.textContent = "Сохранить";
				isNew && fsOpen(fs.cwd, true);
				isNew = false;
			}, "Сохранено"), "primary");
			ta.oninput = () => save.textContent = "Сохранить •";
			ta.onkeydown = (ev) => {
				if ((ev.ctrlKey || ev.metaKey) && ev.key === "s") {
					ev.preventDefault();
					save.click();
				}
				if (ev.key === "Tab") {
					ev.preventDefault();
					ta.setRangeText("	", ta.selectionStart, ta.selectionEnd, "end");
				}
			};
		}
	}
	async function fsUpload(files) {
		if (!fs.writable) return toast("Папка только для чтения", true);
		for (const f of files) {
			toast(`Загрузка ${f.name} (${fmtSize(f.size)})…`);
			if (!await act(null, () => api("/api/fs/upload", f, {
				raw: true,
				headers: {
					"Content-Type": "application/octet-stream",
					"X-Filename": encodeURIComponent(f.name),
					"X-Dir": encodeURIComponent(fs.cwd)
				}
			}), "Загружено: " + f.name)) break;
		}
		fsOpen(fs.cwd, true);
	}
	$("#fs-up").onclick = () => fsOpen(parent(fs.cwd));
	$("#fs-refresh").onclick = () => fsOpen(fs.cwd, true);
	$("#fs-bookmarks").onchange = (e) => {
		if (e.target.value) fsOpen(e.target.value);
		e.target.value = "";
	};
	$("#fs-filter").oninput = renderFs;
	$("#fs-hidden").onchange = renderFs;
	$$("table.fs th[data-sort]").forEach((th) => th.onclick = () => {
		fs.dir = fs.sort === th.dataset.sort ? -fs.dir : 1;
		fs.sort = th.dataset.sort;
		renderFs();
	});
	$("#fs-upload").onclick = () => $("#fs-file").click();
	$("#fs-file").onchange = (e) => {
		fsUpload([...e.target.files]);
		e.target.value = "";
	};
	$("#fs-mkdir").onclick = async () => {
		const name = prompt("Имя новой папки");
		if (name && await act(null, () => api("/api/fs/mkdir", { path: join(fs.cwd, name) }), "Папка создана")) fsOpen(fs.cwd, true);
	};
	$("#fs-newfile").onclick = () => {
		const name = prompt("Имя нового файла");
		if (!name || name.includes("/")) return;
		fs.sel = name;
		renderFs();
		fsPreview({
			name,
			size: 0,
			mtime: 0
		}, true);
	};
	const wrap = $("#fs-wrap");
	wrap.ondragover = (e) => {
		e.preventDefault();
		wrap.classList.add("over");
	};
	wrap.ondragleave = (e) => {
		if (!wrap.contains(e.relatedTarget)) wrap.classList.remove("over");
	};
	wrap.ondrop = (e) => {
		e.preventDefault();
		wrap.classList.remove("over");
		fsUpload([...e.dataTransfer.files]);
	};
	const LAYOUT_KEY = "ov.layout", ZONES = [
		"wz-top",
		"wz-left",
		"wz-right"
	];
	const widgetEls = () => $$("[data-widget]");
	function readLayout() {
		const ids = (el) => [...el.children].filter((c) => c.dataset.widget).map((c) => c.dataset.widget);
		return {
			zones: Object.fromEntries(ZONES.map((z) => [z, ids($("#" + z))])),
			hidden: ids($("#wz-hidden"))
		};
	}
	const DEFAULT_LAYOUT = {
		zones: {
			"wz-top": ["stats"],
			"wz-left": [
				"model",
				"volume",
				"bt",
				"sounds"
			],
			"wz-right": [
				"music",
				"clock",
				"light",
				"device"
			]
		},
		hidden: []
	};
	const homeZone = (id) => ZONES.find((z) => DEFAULT_LAYOUT.zones[z].includes(id)) || "wz-right";
	function applyLayout(l) {
		const byId = Object.fromEntries(widgetEls().map((w) => [w.dataset.widget, w]));
		const put = (parent, id) => {
			if (byId[id]) {
				parent.append(byId[id]);
				delete byId[id];
			}
		};
		ZONES.forEach((z) => (l.zones?.[z] || []).forEach((id) => put($("#" + z), id)));
		(l.hidden || []).forEach((id) => put($("#wz-hidden"), id));
		Object.keys(byId).forEach((id) => put($("#" + homeZone(id)), id));
	}
	function saveLayout() {
		store.set(LAYOUT_KEY, JSON.stringify(readLayout()));
		renderHiddenList();
	}
	function renderHiddenList() {
		const hidden = [...$("#wz-hidden").children];
		$("#ov-hidden-list").innerHTML = hidden.length ? hidden.map((w) => `<button class="chip" data-id="${esc(w.dataset.widget)}">+ ${esc(w.dataset.title)}</button>`).join("") : "<span class=\"meta\">Все виджеты на месте.</span>";
		$$("#ov-hidden-list button").forEach((b) => b.onclick = () => {
			$("#" + homeZone(b.dataset.id)).append($(`[data-widget="${b.dataset.id}"]`));
			saveLayout();
		});
	}
	function moveWidget(w, how) {
		const zone = w.parentElement;
		const sib = (dir) => {
			let s = w[dir];
			while (s && !s.dataset.widget) s = s[dir];
			return s;
		};
		if (how === "up") {
			const s = sib("previousElementSibling");
			if (s) zone.insertBefore(w, s);
		} else if (how === "down") {
			const s = sib("nextElementSibling");
			if (s) s.after(w);
		} else if (how === "side") $(zone.id === "wz-left" ? "#wz-right" : "#wz-left").append(w);
		else if (how === "hide") $("#wz-hidden").append(w);
		saveLayout();
	}
	function widgetBar(w) {
		const b = document.createElement("div");
		b.className = "wbar";
		b.innerHTML = `<span class="grip" title="Перетащить">⠿ ${esc(w.dataset.title)}</span>
    <button data-m="up" aria-label="Выше" title="Выше">↑</button><button data-m="down" aria-label="Ниже" title="Ниже">↓</button>
    <button data-m="side" aria-label="В другую колонку" title="В другую колонку">⇄</button>
    <button data-m="hide" aria-label="Убрать виджет" title="Убрать">✕</button>`;
		b.querySelector(".grip").addEventListener("pointerdown", () => {
			w.draggable = true;
		});
		b.addEventListener("click", (e) => {
			const m = e.target.closest("button")?.dataset.m;
			if (m) moveWidget(w, m);
		});
		return b;
	}
	function setEditing(on) {
		document.body.classList.toggle("editing", on);
		$("#ov-editbar").hidden = !on;
		$("#ov-edit").classList.toggle("primary", on);
		$("#ov-edit").setAttribute("aria-pressed", on);
		$("#ov-edit span").textContent = on ? "Готово" : "Настроить";
		widgetEls().forEach((w) => {
			if (!w.querySelector(":scope > .wbar")) w.prepend(widgetBar(w));
			w.draggable = false;
		});
		renderHiddenList();
	}
	$("#ov-edit").onclick = () => setEditing(!document.body.classList.contains("editing"));
	$("#set-layout-edit").onclick = () => {
		location.hash = "#overview";
		setTimeout(() => {
			setEditing(true);
			window.scrollTo({ top: 0 });
		}, 0);
	};
	$("#set-layout-reset").onclick = () => $("#ov-reset").click();
	$("#ov-done").onclick = () => setEditing(false);
	$("#ov-reset").onclick = () => {
		applyLayout(DEFAULT_LAYOUT);
		$$("#wz-hidden > [data-widget]").forEach((w) => $("#" + homeZone(w.dataset.widget)).append(w));
		saveLayout();
		toast("Раскладка по умолчанию");
	};
	let dragW = null;
	listen(document, "dragstart", (e) => {
		const w = e.target.closest?.("[data-widget]");
		if (!document.body.classList.contains("editing") || !w) return;
		dragW = w;
		w.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", w.dataset.widget);
	});
	listen(document, "dragend", () => {
		if (!dragW) return;
		dragW.classList.remove("dragging");
		dragW.draggable = false;
		dragW = null;
		saveLayout();
	});
	ZONES.forEach((z) => $("#" + z).addEventListener("dragover", (e) => {
		if (!dragW) return;
		e.preventDefault();
		const zone = e.currentTarget;
		const before = [...zone.children].filter((c) => c.dataset.widget && c !== dragW).find((c) => {
			const r = c.getBoundingClientRect();
			return e.clientY < r.top + r.height / 2;
		});
		if (before) {
			if (dragW.nextElementSibling !== before) zone.insertBefore(dragW, before);
		} else if (zone.lastElementChild !== dragW) zone.append(dragW);
	}));
	applyLayout(DEFAULT_LAYOUT);
	try {
		const saved = JSON.parse(store.get(LAYOUT_KEY));
		if (saved) applyLayout(saved);
	} catch {}
	function applyUI() {
		const root = document.documentElement, theme = store.get("ui.theme") || "auto", accent = store.get("ui.accent") || "";
		if (theme === "auto") delete root.dataset.theme;
		else root.dataset.theme = theme;
		for (const [k, v] of [
			["--accent", accent],
			["--accent-ink", accent && `color-mix(in srgb, ${accent} 72%, var(--text))`],
			["--accent-soft", accent && `color-mix(in srgb, ${accent} 15%, var(--card))`]
		]) v ? root.style.setProperty(k, v) : root.style.removeProperty(k);
		window.__vizOff = store.get("ui.viz") === "0";
		$$("#set-theme button").forEach((b) => b.classList.toggle("active", b.dataset.v === theme));
		$$("#set-accent .sw").forEach((b) => b.classList.toggle("sel", b.dataset.v === accent));
		$("#set-viz").checked = !window.__vizOff;
		window.__vizIdleOff = store.get("ui.vizIdle") === "0";
		$("#set-viz-idle").checked = !window.__vizIdleOff;
		privateOff = store.get("ui.private") === "0";
		$("#set-private").checked = !privateOff;
		$("#log-mask").checked = !privateOff;
		applyPrivate();
		if (logText) renderLog();
		$("#set-minibar").checked = minibarOn();
		updateMinibar();
		window.dispatchEvent(new Event("themechange"));
	}
	$$("#set-theme button").forEach((b) => b.onclick = () => {
		store.set("ui.theme", b.dataset.v);
		applyUI();
	});
	$$("#set-accent .sw").forEach((b) => b.onclick = () => {
		store.set("ui.accent", b.dataset.v);
		applyUI();
	});
	$("#set-viz").onchange = (e) => {
		store.set("ui.viz", e.target.checked ? "1" : "0");
		applyUI();
	};
	$("#set-viz-idle").onchange = (e) => {
		store.set("ui.vizIdle", e.target.checked ? "1" : "0");
		applyUI();
	};
	$("#set-private").onchange = (e) => {
		store.set("ui.private", e.target.checked ? "1" : "0");
		applyUI();
	};
	$("#set-minibar").onchange = (e) => {
		store.set("ui.minibar", e.target.checked ? "1" : "0");
		applyUI();
		loadMusic();
	};
	applyUI();
	let accessInfo = null, installEvt = null;
	const isLocalHost = [
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(location.hostname);
	async function authPost(path, body) {
		const r = await PanelContext.fetch(path, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body || {})
		});
		const d = await r.json().catch(() => ({}));
		if (!r.ok) throw new Error(d.error || r.statusText);
		return d;
	}
	async function loadAccess() {
		try {
			accessInfo = await (await PanelContext.fetch("/api/panel-auth")).json();
		} catch {
			return;
		}
		const a = accessInfo, st = $("#pw-state");
		st.textContent = a.enabled ? "Задан. Вход запоминается в этом браузере на 90 дней" : isLocalHost ? "Не задан. Пока панель открыта только на этом компьютере, это не страшно" : "Не задан — любой в вашей сети может управлять колонкой и её файлами";
		st.classList.toggle("warn", !a.enabled && !isLocalHost);
		$("#pw-set").textContent = a.enabled ? "Сменить" : "Задать";
		$("#pw-off").hidden = $("#pw-logout").hidden = !a.enabled;
		$("#pw-cur").hidden = !a.enabled;
		const others = Math.max(0, (a.sessions || 0) - 1);
		$("#pw-others-row").hidden = !others;
		$("#pw-others-n").textContent = `Ещё ${others} — браузеры, где выполнен вход`;
		renderInstall();
	}
	function pwForm(mode) {
		const f = $("#pw-form");
		f.hidden = !mode;
		f.dataset.mode = mode || "";
		if (!mode) return;
		f.reset();
		const off = mode === "off";
		$("#pw-cur").hidden = !accessInfo?.enabled;
		$("#pw-new").hidden = $("#pw-new2").hidden = off;
		$("#pw-save").textContent = off ? "Убрать пароль" : "Сохранить";
		$("#pw-save").classList.toggle("danger", off);
		(accessInfo?.enabled ? $("#pw-cur") : $("#pw-new")).focus();
	}
	$("#pw-set").onclick = () => pwForm("set");
	$("#pw-off").onclick = () => pwForm("off");
	$("#pw-cancel").onclick = () => pwForm(null);
	$("#pw-form").onsubmit = (e) => {
		e.preventDefault();
		const off = $("#pw-form").dataset.mode === "off", cur = $("#pw-cur").value, nw = $("#pw-new").value;
		if (!off && nw !== $("#pw-new2").value) return toast("Пароли не совпадают", true);
		act($("#pw-save"), async () => {
			if (off) await authPost("/api/panel-auth/disable", { current: cur });
			else await authPost("/api/panel-auth/password", {
				current: cur,
				password: nw
			});
			pwForm(null);
			await loadAccess();
		}, off ? "Пароль убран" : "Пароль сохранён, другие входы завершены");
	};
	$("#pw-logout").onclick = (e) => act(e.currentTarget, async () => {
		await authPost("/api/panel-auth/logout");
		await connCheck();
	});
	$("#pw-others").onclick = (e) => act(e.currentTarget, async () => {
		const r = await authPost("/api/panel-auth/logout-others");
		await loadAccess();
		return r;
	}, "Другие входы завершены");
	let footprint = null;
	async function loadFootprint() {
		try {
			footprint = await api("/api/footprint");
		} catch {
			return;
		}
		const f = footprint, kb = (x) => x >= 1024 ? (x / 1024).toFixed(1) + " МБ" : x + " КБ";
		$("#fp-list").innerHTML = f.items.map((i) => `<div class="fp-item${i.on ? " on" : ""}"><i></i><span>${esc(i.name)}${i.on && (i.detail || i.size_kb) ? ` <small>${esc([i.detail, i.size_kb ? kb(i.size_kb) : ""].filter(Boolean).join(" · "))}</small>` : ""}${i.on ? "" : " <small>— нет</small>"}</span></div>`).join("");
		$("#fp-info").textContent = f.any ? `Всё лежит в ${f.dir} · ${kb(f.size_kb)}` + (f.yam_installed ? " · yam не затрагивается, у него своё удаление" : "") : "Сейчас на колонке ничего от панели нет";
		$("#fp-reset").disabled = !f.any;
		loadPrivacy();
	}
	async function loadPrivacy() {
		let p;
		try {
			p = await api("/api/privacy");
		} catch {
			return;
		}
		$("#privacy-on").checked = p.enabled;
		$("#privacy-purge").hidden = !(p.enabled && p.queued > 16);
		$("#privacy-on").disabled = false;
		const q = p.queued > 16 ? ` Сейчас в очереди ${(p.queued / 1024).toFixed(1)} КБ.` : "";
		$("#privacy-state").textContent = p.enabled ? p.blocked ? `Включено: ${p.hosts.join(", ")} → 127.0.0.1. Неотправленная аналитика удаляется при каждом включении колонки.${q}` : "Включено, но адрес аналитики всё ещё доступен — попробуйте выключить и включить снова" : "Адреса сбора статистики (clck, appmetrica, metrica) ведут в никуда. Системный раздел не меняется, Алиса и музыка работают как обычно";
	}
	$("#privacy-purge").onclick = (e) => {
		e.preventDefault();
		act(e.currentTarget, async () => {
			await api("/api/privacy/purge", {});
			await loadPrivacy();
		}, "Накопленная аналитика удалена");
	};
	$("#privacy-on").onchange = (e) => {
		const on = e.target.checked;
		e.target.disabled = true;
		api("/api/privacy", { enabled: on }).then(() => toast(on ? "Аналитика заблокирована" : "Блокировка аналитики снята")).catch((err) => toast(err.message, true)).finally(loadFootprint);
	};
	$("#fp-reset").onclick = (e) => {
		if (!confirm("Удалить с колонки всё, что поставила панель?\n\n• своя заставка и звук запуска — вернутся стандартные;\n• будильники и их звуки;\n• блокировка аналитики;\n• флаги автозапуска;\n• строка в rootkeeper.sh и копии оригиналов.\n\nКолонку перезагружать не нужно.")) return;
		act(e.currentTarget, async () => {
			footprint = await api("/api/footprint/reset", {});
			await loadFootprint();
			if (footprint?.note) toast(footprint.note, true);
			bootLoaded = false;
			alarmsData = null;
		}, "С колонки удалено всё, что ставила панель");
	};
	const UI_KEYS = /^(ui|ov|ch|snd)\./;
	$("#bk-save").onclick = (e) => act(e.currentTarget, async () => {
		const ui = {};
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i);
				if (UI_KEYS.test(k)) ui[k] = localStorage.getItem(PanelContext.storageKey(k));
			}
		} catch {}
		const r = await PanelContext.fetch("/api/backup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ui })
		});
		if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
		const name = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "")?.[1] || "stantsiya-backup.tar.gz";
		const a = document.createElement("a");
		a.href = URL.createObjectURL(await r.blob());
		a.download = name;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
	}, "Копия скачана");
	$("#bk-restore").onclick = () => $("#bk-file").click();
	$("#bk-file").onchange = async (e) => {
		const f = e.target.files[0];
		e.target.value = "";
		if (!f || !confirm(`Восстановить из «${f.name}»?\n\nТо, что сейчас стоит на колонке от панели (заставка, звук запуска, будильники), будет заменено содержимым копии. Оформление и раскладка этого браузера тоже вернутся из копии.`)) return;
		toast("Восстанавливаем… это может занять минуту");
		const r = await act($("#bk-restore"), () => api("/api/backup/restore", f, {
			raw: true,
			headers: { "Content-Type": "application/gzip" }
		}));
		if (!r) return;
		try {
			for (const [k, v] of Object.entries(r.ui || {})) if (UI_KEYS.test(k)) localStorage.setItem(PanelContext.storageKey(k), v);
		} catch {}
		applyUI();
		try {
			const saved = JSON.parse(store.get(LAYOUT_KEY));
			if (saved) applyLayout(saved);
		} catch {}
		bootLoaded = false;
		alarmsData = null;
		await loadFootprint();
		const when = r.created ? new Date(r.created.replace(/([+-]\d\d)(\d\d)$/, "$1:$2")).toLocaleString("ru-RU") : "";
		toast("Восстановлено" + (when ? ` (копия от ${when})` : "") + ": " + (r.restored.length ? r.restored.join(", ") : "на колонке ничего не было"));
	};
	listen(window, "beforeinstallprompt", (e) => {
		e.preventDefault();
		installEvt = e;
		renderInstall();
	});
	listen(window, "appinstalled", () => {
		installEvt = null;
		renderInstall();
		toast("Панель установлена");
	});
	function renderInstall() {
		const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
		const hint = $("#app-hint"), st = $("#app-state"), a = accessInfo || {}, httpsPort = a.ports?.https;
		$("#app-install").hidden = !installEvt;
		$("#app-ca-row").hidden = !(a.ca && httpsPort);
		hint.hidden = true;
		if (standalone) {
			st.textContent = "Панель уже открыта как приложение";
			return;
		}
		if (installEvt) {
			st.textContent = "Появится иконка, панель откроется в отдельном окне";
			return;
		}
		if (!isSecureContext) {
			st.textContent = "Браузер разрешает установку только по HTTPS";
			if (httpsPort) {
				const url = `https://${location.hostname}:${httpsPort}${PanelContext.basePath}`;
				hint.innerHTML = `Откройте панель по адресу <a href="${url}">${esc(url)}</a>. Чтобы браузер ей доверял, один раз установите сертификат (строка ниже): на Android — «Настройки → Безопасность → Шифрование и учётные данные → Установить сертификат → Сертификат ЦС»; на iPhone — открыть файл, затем «Основные → Об этом устройстве → Доверие сертификатам».`;
			} else hint.textContent = "HTTPS выключен: запустите server.py без --https-port 0.";
			hint.hidden = false;
			return;
		}
		st.textContent = "Через меню браузера: «Установить приложение» или «На экран „Домой“»";
	}
	$("#app-install").onclick = async () => {
		if (!installEvt) return;
		installEvt.prompt();
		await installEvt.userChoice.catch(() => null);
		installEvt = null;
		renderInstall();
	};
	if ("serviceWorker" in navigator && isSecureContext) navigator.serviceWorker.register(PanelContext.url("/sw.js"), { scope: PanelContext.basePath }).catch(() => {});
	loadAccess();
	const CHARTS = [
		{
			k: "cpu",
			name: "Процессор",
			unit: "%",
			min: 0,
			max: 100,
			fmt: (v) => Math.round(v)
		},
		{
			k: "temp",
			name: "Температура",
			unit: "°C",
			pad: 2,
			fmt: (v) => v.toFixed(1)
		},
		{
			k: "mem",
			name: "Память занята",
			unit: "МБ",
			min: 0,
			total: true,
			fmt: (v) => Math.round(v)
		},
		{
			k: "rssi",
			name: "Сигнал Wi‑Fi",
			unit: "дБм",
			pad: 3,
			fmt: (v) => Math.round(v),
			note: "ближе к нулю — лучше"
		},
		{
			k: "disk",
			name: "Диск /data занят",
			unit: "МБ",
			min: 0,
			total: true,
			fmt: (v) => v.toFixed(1)
		},
		{
			k: "load",
			name: "Средняя нагрузка",
			unit: "",
			min: 0,
			fmt: (v) => v.toFixed(2),
			note: "load average за минуту"
		}
	];
	const EV_TEXT = {
		reboot: "⟲",
		offline: "⨯",
		online: "✓",
		alarm: "⏰"
	};
	let chData = null, chRange = +(store.get("ch.range") || 3600), chHover = null, chTimer;
	$("#ch-grid").innerHTML = CHARTS.map((c) => `<section class="card chart-card">
  <div class="chart-head"><h2>${c.name}</h2><div class="chart-val" id="ch-${c.k}-v">—</div></div>
  <div class="chart-sub" id="ch-${c.k}-sub">${c.note || ""}</div>
  <svg class="chart-svg" id="ch-${c.k}" role="img" aria-label="${c.name}"></svg></section>`).join("");
	const hm = (t) => {
		const d = /* @__PURE__ */ new Date(t * 1e3);
		return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
	};
	function niceTicks(lo, hi, n = 3) {
		const span = hi - lo || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
		const step = [
			1,
			2,
			2.5,
			5,
			10
		].map((m) => m * mag).find((s) => span / s <= n) || 10 * mag;
		const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step - 1e-9) * step, out = [];
		for (let v = a; v <= b + step * 1e-9; v += step) out.push(+v.toFixed(6));
		return {
			ticks: out,
			lo: out[0],
			hi: out[out.length - 1]
		};
	}
	async function loadCharts() {
		clearTimeout(chTimer);
		if (shownTab !== "charts") return;
		try {
			chData = await api("/api/metrics?range=" + chRange);
			renderCharts();
		} catch (e) {
			if (!e.offline) toast(e.message, true);
		}
		chTimer = setTimeout(loadCharts, 1e4);
	}
	function chGeom(svg) {
		return {
			W: svg.clientWidth || 600,
			H: svg.clientHeight || 150,
			L: 40,
			R: 8,
			T: 8,
			B: 20
		};
	}
	function xOf(g, t) {
		return g.L + (t - chData.from) / (chData.to - chData.from) * (g.W - g.L - g.R);
	}
	function renderCharts() {
		const d = chData;
		if (!d) return;
		$$("#ch-range button").forEach((b) => b.classList.toggle("active", +b.dataset.v === chRange));
		const xt = {
			900: 300,
			3600: 900,
			21600: 3600,
			86400: 14400
		}[chRange] || 3600;
		const xTicks = [];
		for (let t = Math.ceil(d.from / xt) * xt; t <= d.to; t += xt) xTicks.push(t);
		for (const c of CHARTS) {
			const svg = $("#ch-" + c.k), g = chGeom(svg), vals = d[c.k];
			const pts = d.t.map((t, i) => [t, vals[i]]).filter((p) => p[1] != null);
			svg.setAttribute("viewBox", `0 0 ${g.W} ${g.H}`);
			if (!pts.length) {
				svg.innerHTML = `<text class="axis" x="${g.W / 2}" y="${g.H / 2}" text-anchor="middle">Данных пока нет</text>`;
				c.y = null;
				continue;
			}
			const cmax = c.total && d.totals?.[c.k] ? d.totals[c.k] : c.max;
			let lo = c.min ?? Math.min(...pts.map((p) => p[1])) - (c.pad || 0), hi = cmax ?? Math.max(...pts.map((p) => p[1])) + (c.pad || 0);
			if (c.min != null && cmax == null) hi = Math.max(hi * 1.1, lo + 1);
			const nt = niceTicks(lo, hi);
			lo = c.min ?? nt.lo;
			hi = cmax ?? nt.hi;
			const y = (v) => g.T + (1 - (v - lo) / (hi - lo || 1)) * (g.H - g.T - g.B);
			c.y = y;
			c.g = g;
			let path = "", area = "", run = [];
			const flush = () => {
				if (!run.length) return;
				const seg = run.map((p, i) => {
					const X = xOf(g, p[0]).toFixed(1), Y = y(p[1]).toFixed(1);
					if (c.step && i) return `H${X}V${Y}`;
					return (i ? "L" : "M") + X + "," + Y;
				}).join("");
				path += seg;
				area += seg + `V${(g.H - g.B).toFixed(1)}H${xOf(g, run[0][0]).toFixed(1)}Z`;
				run = [];
			};
			d.t.forEach((t, i) => {
				if (vals[i] == null) flush();
				else run.push([t, vals[i]]);
			});
			flush();
			svg.innerHTML = (cmax && c.total ? [
				0,
				Math.round(cmax / 2),
				cmax
			] : nt.ticks.filter((v) => v >= lo && v <= hi)).map((v) => `<line class="grid" x1="${g.L}" x2="${g.W - g.R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${g.L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("") + xTicks.map((t) => `<text class="axis" x="${xOf(g, t)}" y="${g.H - 4}" text-anchor="middle">${hm(t)}</text>`).join("") + d.events.map((e) => `<line class="ev" x1="${xOf(g, e.t)}" x2="${xOf(g, e.t)}" y1="${g.T}" y2="${g.H - g.B}"><title>${hm(e.t)} ${esc(e.text)}</title></line>`).join("") + `<path class="area" d="${area}"/><path class="line" d="${path}"/><g class="hover" visibility="hidden"><line class="cross" y1="${g.T}" y2="${g.H - g.B}"/><circle class="dot" r="4"/></g>`;
		}
		const ps = $("#ch-play"), pg = {
			...chGeom(ps),
			T: 4,
			B: 18
		};
		ps.setAttribute("viewBox", `0 0 ${pg.W} ${pg.H}`);
		const bw = Math.max(1, (pg.W - pg.L - pg.R) * d.step / (d.to - d.from));
		ps.innerHTML = `<line class="grid" x1="${pg.L}" x2="${pg.W - pg.R}" y1="${pg.H - pg.B}" y2="${pg.H - pg.B}"/>` + d.t.map((t, i) => d.play[i] ? `<rect class="bar" x="${(xOf(pg, t) - bw / 2).toFixed(1)}" y="${pg.T}" width="${bw.toFixed(1)}" height="${pg.H - pg.T - pg.B}" rx="1"/>` : "").join("") + xTicks.map((t) => `<text class="axis" x="${xOf(pg, t)}" y="${pg.H - 3}" text-anchor="middle">${hm(t)}</text>`).join("") + `<g class="hover" visibility="hidden"><line class="cross" y1="${pg.T}" y2="${pg.H - pg.B}"/></g>`;
		const played = d.play.filter(Boolean).length * d.step;
		$("#ch-play-v").innerHTML = played ? `${played >= 3600 ? (played / 3600).toFixed(1) + "<span>ч</span>" : Math.round(played / 60) + "<span>мин</span>"}` : "—";
		$("#ch-events").innerHTML = d.events.length ? d.events.slice().reverse().map((e) => `<div class="ev-row"><time>${hm(e.t)}</time><span>${EV_TEXT[e.type] || "•"} ${esc(e.text)}</span></div>`).join("") : "<span class=\"meta\">За этот период ничего не случилось</span>";
		showHover(chHover);
	}
	function showHover(t) {
		const d = chData;
		if (!d) return;
		let i = -1;
		if (t != null) {
			let best = Infinity;
			d.t.forEach((x, k) => {
				const dd = Math.abs(x - t);
				if (dd < best) {
					best = dd;
					i = k;
				}
			});
		}
		for (const c of CHARTS) {
			const h = $("#ch-" + c.k).querySelector(".hover");
			const vals = d[c.k];
			let k = i;
			if (k < 0) for (k = vals.length - 1; k >= 0 && vals[k] == null; k--);
			const v = k >= 0 ? vals[k] : null;
			const tot = c.total && d.totals?.[c.k];
			$("#ch-" + c.k + "-v").innerHTML = v == null ? "—" : `${c.fmt(v)}<span>${c.unit}${tot ? ` из ${tot} · ${Math.round(v / tot * 100)}%` : ""}</span>`;
			$("#ch-" + c.k + "-sub").textContent = i >= 0 ? `в ${hm(d.t[i])}` + (d.step > d.interval ? ` · среднее за ${d.step >= 60 ? Math.round(d.step / 60) + " мин" : d.step + " с"}` : "") : c.note || "сейчас";
			if (!h || !c.y) continue;
			if (i < 0) {
				h.setAttribute("visibility", "hidden");
				continue;
			}
			const X = xOf(c.g, d.t[i]);
			h.setAttribute("visibility", "visible");
			h.querySelector(".cross").setAttribute("x1", X);
			h.querySelector(".cross").setAttribute("x2", X);
			const dot = h.querySelector(".dot");
			if (v == null || k !== i) dot.setAttribute("visibility", "hidden");
			else {
				dot.setAttribute("visibility", "visible");
				dot.setAttribute("cx", X);
				dot.setAttribute("cy", c.y(v));
			}
		}
		const ph = $("#ch-play .hover");
		if (ph) {
			if (i < 0) ph.setAttribute("visibility", "hidden");
			else {
				const X = xOf({ ...chGeom($("#ch-play")) }, d.t[i]);
				ph.setAttribute("visibility", "visible");
				ph.querySelector(".cross").setAttribute("x1", X);
				ph.querySelector(".cross").setAttribute("x2", X);
			}
			$("#ch-play-sub").textContent = i >= 0 ? `в ${hm(d.t[i])}: ${d.play[i] ? "играла" : "тишина"}` : "когда колонка что-то играла (музыка, ответы Алисы, звуки)";
		}
	}
	function chPointer(e) {
		const svg = e.currentTarget, r = svg.getBoundingClientRect(), g = chGeom(svg);
		const fx = (e.clientX - r.left - g.L) / (g.W - g.L - g.R);
		if (!chData || fx < 0 || fx > 1) {
			chHover = null;
			return showHover(null);
		}
		chHover = chData.from + fx * (chData.to - chData.from);
		showHover(chHover);
	}
	$$("#tab-charts .chart-svg").forEach((svg) => {
		svg.addEventListener("pointermove", chPointer);
		svg.addEventListener("pointerleave", () => {
			chHover = null;
			showHover(null);
		});
	});
	$$("#ch-range button").forEach((b) => b.onclick = () => {
		chRange = +b.dataset.v;
		store.set("ch.range", chRange);
		loadCharts();
	});
	new ResizeObserver(() => shownTab === "charts" && renderCharts()).observe($("#ch-grid"));
	$("#ch-clear").onclick = (e) => {
		if (!confirm("Стереть всю историю графиков?")) return;
		act(e.currentTarget, async () => {
			await api("/api/metrics/clear", {});
			await loadCharts();
		}, "История очищена");
	};
	$("#ch-csv").onclick = () => {
		const d = chData;
		if (!d) return;
		const rows = [[
			"время",
			...CHARTS.map((c) => c.name + (c.unit ? ", " + c.unit : "")),
			"играла"
		]];
		d.t.forEach((t, i) => rows.push([
			(/* @__PURE__ */ new Date(t * 1e3)).toLocaleString("ru-RU"),
			...CHARTS.map((c) => d[c.k][i] ?? ""),
			d.play[i] ?? ""
		]));
		const blob = new Blob(["﻿" + rows.map((r) => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `stantsiya-${hm(d.to).replace(":", "")}.csv`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
	};
	const DAY_NAMES = [
		"Пн",
		"Вт",
		"Ср",
		"Чт",
		"Пт",
		"Сб",
		"Вс"
	];
	const AL_MODES = {
		wave: {
			name: "Моя волна",
			hint: "Алиса включит «Мою волну»."
		},
		show: {
			name: "Утреннее шоу",
			hint: "Утреннее шоу Алисы: музыка, погода, новости."
		},
		music: {
			name: "Музыка",
			cap: "Что включить",
			ph: "например: плейлист дня, Queen, джаз",
			hint: "Алиса получит запрос «включи …»."
		},
		text: {
			name: "Запрос Алисе",
			cap: "Что сказать Алисе",
			ph: "например: доброе утро",
			hint: "Запрос уходит Алисе как есть, будто вы сказали его вслух."
		},
		sound: {
			name: "Звук",
			hint: "Играет по кругу прямо с колонки — не нужен ни интернет, ни Алиса."
		}
	};
	let alarmsData = null, alEditing = null, alUploaded = [];
	const sndName = (a) => a.sound.startsWith("u_") ? a.sound_name : (a.sound_name || "common/timer.wav").split("/").pop().replace(/\.[^.]+$/, "");
	function daysText(d) {
		if (!d) return "Один раз";
		if (d === "1234567") return "Каждый день";
		if (d === "12345") return "По будням";
		if (d === "67") return "По выходным";
		return [...d].map((x) => DAY_NAMES[x - 1]).join(", ");
	}
	function nextFire(a) {
		const [h, m] = a.time.split(":").map(Number), now = /* @__PURE__ */ new Date();
		for (let i = 0; i < 8; i++) {
			const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m);
			const dow = (d.getDay() + 6) % 7 + 1;
			if (d > now && (!a.days || a.days.includes(dow))) return d;
		}
		return null;
	}
	function inText(ms) {
		const min = Math.round(ms / 6e4), h = Math.floor(min / 60), m = min % 60;
		return "через " + (h ? `${h} ч ` : "") + (m || !h ? `${m} мин` : "");
	}
	async function loadAlarms() {
		try {
			alarmsData = await api("/api/alarms");
		} catch (e) {
			if (!e.offline) $("#al-list").innerHTML = `<div class="empty">${esc(e.message)}</div>`;
			return;
		}
		renderAlarms();
	}
	function renderAlarms() {
		const d = alarmsData;
		if (!d) return;
		const on = d.alarms.filter((a) => a.on);
		const next = on.map((a) => [a, nextFire(a)]).filter((x) => x[1]).sort((x, y) => x[1] - y[1])[0];
		$("#al-badge").textContent = !d.alarms.length ? "нет" : next ? `ближайший ${inText(next[1] - Date.now())}` : "все выключены";
		$("#al-badge").className = "badge" + (on.length && d.running ? " ok" : on.length && !d.running ? " bad" : "");
		if (on.length && !d.running) $("#al-badge").textContent = "демон не запущен — сохраните ещё раз";
		$("#al-list").innerHTML = d.alarms.length ? d.alarms.map((a) => {
			const m = AL_MODES[a.mode] || AL_MODES.sound;
			const what = a.mode === "music" ? `Включить: ${a.query}` : a.mode === "text" ? `«${a.query}»` : m.name;
			const extra = [
				a.mode !== "sound" ? `иначе звук «${sndName(a)}»` : `звук «${sndName(a)}»`,
				`громкость ${a.volume * 10}%`,
				a.ramp ? `нарастание ${a.ramp >= 60 ? a.ramp / 60 + " мин" : a.ramp + " с"}` : ""
			].filter(Boolean).join(" · ");
			return `<div class="al-row${a.on ? "" : " off"}" data-id="${esc(a.id)}">
      <div class="al-time">${esc(a.time)}</div>
      <div class="al-info"><b>${esc(a.label || daysText(a.days))}</b>
        <div class="meta">${esc(a.label ? daysText(a.days) + " · " : "")}${esc(what)}</div><div class="meta">${esc(extra)}</div></div>
      <div class="actions">
        <input type="checkbox" data-a="toggle" ${a.on ? "checked" : ""} aria-label="Включён" title="Включён">
        <button class="btn sm" data-a="test" title="Сработает прямо сейчас">Проверить</button>
        <button class="btn sm" data-a="edit">Изменить</button>
      </div></div>`;
		}).join("") : "<div class=\"empty\">Будильников пока нет</div>";
		$("#al-tz").textContent = d.pc_tz || "неизвестен (используется UTC)";
		$("#al-devtime").textContent = d.device_time?.hm ? `на колонке ${d.device_time.hm} ${d.device_time.zone || ""}` : "";
		const alName = (id) => {
			const a = d.alarms.find((x) => x.id === id);
			return a ? a.time + (a.label ? " " + a.label : "") : id;
		};
		$("#al-log").textContent = d.log.length ? d.log.slice().reverse().map((l) => l.replace(/ ([0-9a-f]{8}): /, (_, id) => ` ${alName(id)}: `)).join("\n") : "Пока пусто";
		const sn = d.snooze;
		$("#al-snoozed").hidden = !sn;
		if (sn) {
			const a = d.alarms.find((x) => x.id === sn.id), t = /* @__PURE__ */ new Date(sn.at * 1e3);
			$("#al-snoozed-text").textContent = `Отложенный будильник${a?.label ? " «" + a.label + "»" : ""} зазвонит в ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
		}
		renderAlarmBar();
		const inst = d.installed;
		$("#al-setup").hidden = inst;
		[
			"#al-list-card",
			"#al-cols",
			"#al-add"
		].forEach((x) => $(x).hidden = !inst);
		if (!inst) {
			$("#al-editor").hidden = true;
			$("#al-snoozed").hidden = true;
		}
		$("#al-install-note").textContent = d.ffmpeg ? "" : "Для перекодирования установи FFmpeg в среде панели.";
		$("#al-install").disabled = !d.ffmpeg;
		$("#al-inst-info").textContent = `${d.dir}${d.size_kb != null ? " · " + (d.size_kb >= 1024 ? (d.size_kb / 1024).toFixed(1) + " МБ" : d.size_kb + " КБ") : ""}` + (d.outdated ? " · есть новая версия скрипта" : "");
		$("#al-update").hidden = !d.outdated;
	}
	function renderAlarmBar() {
		const st = alarmsData?.state, bar = $("#alarm-bar");
		bar.hidden = !st?.ringing;
		if (!st?.ringing) return;
		const a = alarmsData.alarms.find((x) => x.id === st.id);
		$("#ab-title").textContent = "Будильник" + (a ? " " + a.time : "") + (a?.label ? " · " + a.label : "");
		$("#ab-sub").textContent = st.via === "alice" ? "играет Алиса" : st.via === "starting" ? "включаем…" : "играет звук";
		$("#ab-snooze").hidden = !a?.snooze;
		if (a?.snooze) $("#ab-snooze").textContent = `Отложить на ${a.snooze} мин`;
	}
	const alToSave = (a) => ({
		...a,
		sound: a.sound.startsWith("s_") ? "sys:" + a.sound_name : a.sound
	});
	async function saveAlarms(list, msg) {
		alarmsData = await api("/api/alarms", { alarms: list });
		renderAlarms();
		if (msg) toast(msg);
	}
	$("#al-list").onclick = (e) => {
		const b = e.target.closest("[data-a]"), row = e.target.closest(".al-row");
		if (!b || !row) return;
		const a = alarmsData.alarms.find((x) => x.id === row.dataset.id);
		if (b.dataset.a === "edit") openAlarm(a);
		if (b.dataset.a === "test") act(b, async () => {
			await api("/api/alarms/test", { id: a.id });
			setTimeout(loadAlarms, 2500);
		}, "Сейчас зазвонит…");
	};
	$("#al-list").onchange = (e) => {
		if (e.target.dataset.a !== "toggle") return;
		const id = e.target.closest(".al-row").dataset.id;
		const list = alarmsData.alarms.map((a) => alToSave(a.id === id ? {
			...a,
			on: e.target.checked
		} : a));
		act(null, () => saveAlarms(list, e.target.checked ? "Будильник включён" : "Будильник выключен"));
	};
	$("#al-days").innerHTML = DAY_NAMES.map((n, i) => `<button type="button" class="chip" data-d="${i + 1}" aria-pressed="false">${n}</button>`).join("");
	$("#al-days").onclick = (e) => {
		const c = e.target.closest(".chip");
		if (c) c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true");
	};
	$("#al-presets").onclick = (e) => {
		const c = e.target.closest(".chip");
		if (c) setDays(c.dataset.d);
	};
	function setDays(d) {
		$$("#al-days .chip").forEach((c) => c.setAttribute("aria-pressed", d.includes(c.dataset.d)));
	}
	const getDays = () => $$("#al-days .chip").filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.d).join("");
	function fillSounds(sel) {
		const groups = {};
		(sounds || []).forEach((n) => {
			const [g, ...r] = n.split("/");
			(groups[r.length ? g : ""] ||= []).push(n);
		});
		const up = [...new Map([...alUploaded, ...(alarmsData?.alarms || []).filter((a) => a.sound.startsWith("u_")).map((a) => ({
			sound: a.sound,
			sound_name: a.sound_name
		}))].map((u) => [u.sound, u])).values()];
		$("#al-sound").innerHTML = (up.length ? `<optgroup label="Свои">${up.map((u) => `<option value="${esc(u.sound)}">${esc(u.sound_name)}</option>`).join("")}</optgroup>` : "") + Object.entries(groups).map(([g, l]) => `<optgroup label="${esc(g || "Система")}">${l.map((n) => `<option value="sys:${esc(n)}">${esc(n.split("/").pop().replace(/\.[^.]+$/, ""))}</option>`).join("")}</optgroup>`).join("");
		$("#al-sound").value = sel;
		if ($("#al-sound").selectedIndex < 0) $("#al-sound").value = "sys:common/timer.wav";
	}
	function alModeUI() {
		const m = $("#al-mode").value, info = AL_MODES[m];
		$("#al-query-l").hidden = !info.cap;
		if (info.cap) {
			$("#al-query-cap").textContent = info.cap;
			$("#al-query").placeholder = info.ph;
		}
		$("#al-mode-hint").textContent = info.hint + (m === "sound" ? "" : " Нужен интернет; без него или если Алиса не ответит за 30 с — играет звук ниже.");
		$("#al-sound-cap").textContent = m === "sound" ? "Звук" : "Звук, если Алиса не сможет";
		$("#al-dur").querySelector("[value=\"0\"]").disabled = m === "sound";
		if (m === "sound" && $("#al-dur").value === "0") $("#al-dur").value = "15";
	}
	$("#al-mode").onchange = alModeUI;
	$("#al-vol").oninput = () => $("#al-vol-v").textContent = $("#al-vol").value * 10;
	function openAlarm(a) {
		alEditing = a || null;
		const x = a || {
			time: "07:30",
			days: "12345",
			mode: "wave",
			query: "",
			sound: "",
			volume: 5,
			ramp: 180,
			duration: 15,
			snooze: 9,
			label: ""
		};
		$("#al-ed-title").textContent = a ? "Будильник " + a.time : "Новый будильник";
		$("#al-time").value = x.time;
		$("#al-label").value = x.label;
		setDays(x.days);
		$("#al-mode").value = x.mode;
		$("#al-query").value = x.query;
		fillSounds(x.sound.startsWith("u_") ? x.sound : x.sound.startsWith("s_") ? "sys:" + x.sound_name : "sys:common/timer.wav");
		$("#al-vol").value = x.volume;
		$("#al-vol").oninput();
		$("#al-ramp").value = String(x.ramp);
		if ($("#al-ramp").selectedIndex < 0) $("#al-ramp").value = "180";
		$("#al-dur").value = String(x.duration);
		if ($("#al-dur").selectedIndex < 0) $("#al-dur").value = "15";
		$("#al-snz").value = String(x.snooze);
		if ($("#al-snz").selectedIndex < 0) $("#al-snz").value = "9";
		$("#al-del").hidden = !a;
		alModeUI();
		$("#al-editor").hidden = false;
		$("#al-editor").scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
	$("#al-add").onclick = () => openAlarm(null);
	$("#al-cancel").onclick = () => {
		$("#al-editor").hidden = true;
	};
	$("#al-form").onsubmit = (e) => {
		e.preventDefault();
		const snd = $("#al-sound").value, opt = $("#al-sound").selectedOptions[0];
		const item = {
			id: alEditing?.id,
			on: alEditing ? alEditing.on : true,
			time: $("#al-time").value,
			days: getDays(),
			mode: $("#al-mode").value,
			query: $("#al-query").value.trim(),
			label: $("#al-label").value.trim(),
			sound: snd,
			sound_name: snd.startsWith("sys:") ? snd.slice(4) : opt?.textContent || "",
			volume: +$("#al-vol").value,
			ramp: +$("#al-ramp").value,
			duration: +$("#al-dur").value,
			snooze: +$("#al-snz").value
		};
		if (alEditing && (alEditing.time !== item.time || alEditing.days !== item.days)) item.on = true;
		const list = (alarmsData?.alarms || []).filter((a) => a.id !== alEditing?.id).map(alToSave);
		list.push(item);
		list.sort((a, b) => a.time.localeCompare(b.time));
		act($("#al-save"), async () => {
			await saveAlarms(list);
			$("#al-editor").hidden = true;
		}, "Будильник сохранён на колонке");
	};
	$("#al-del").onclick = (e) => {
		if (!alEditing || !confirm("Удалить будильник " + alEditing.time + "?")) return;
		const list = alarmsData.alarms.filter((a) => a.id !== alEditing.id).map(alToSave);
		act(e.currentTarget, async () => {
			await saveAlarms(list);
			$("#al-editor").hidden = true;
		}, "Будильник удалён");
	};
	$("#al-sound-play").onclick = (e) => {
		const v = $("#al-sound").value;
		if (!v.startsWith("sys:")) return toast("Свой звук можно послушать кнопкой «Проверить» после сохранения");
		act(e.currentTarget, () => api("/api/play", { name: v.slice(4) }));
	};
	$("#al-sound-up").onclick = () => $("#al-sound-file").click();
	$("#al-sound-file").onchange = async (e) => {
		const f = e.target.files[0];
		e.target.value = "";
		if (!f) return;
		toast("Загружаем " + f.name + "…");
		const r = await act($("#al-sound-up"), () => api("/api/alarms/sound", f, {
			raw: true,
			headers: {
				"Content-Type": "application/octet-stream",
				"X-Filename": encodeURIComponent(f.name)
			}
		}), "Звук загружен");
		if (r) {
			alUploaded.push(r);
			fillSounds(r.sound);
		}
	};
	$("#al-install").onclick = (e) => act(e.currentTarget, async () => {
		alarmsData = await api("/api/alarms/install", {});
		renderAlarms();
	}, "Будильник установлен на колонку");
	$("#al-update").onclick = (e) => act(e.currentTarget, async () => {
		alarmsData = await api("/api/alarms/install", {});
		renderAlarms();
	}, "Скрипт обновлён");
	$("#al-uninstall").onclick = (e) => {
		const n = alarmsData?.alarms.length || 0;
		if (!confirm("Удалить будильник с колонки?" + (n ? ` Все будильники (${n}) и загруженные звуки будут удалены.` : "") + " Строка автозапуска уберётся из rootkeeper.sh, если она больше ничему не нужна.")) return;
		act(e.currentTarget, async () => {
			alarmsData = await api("/api/alarms/uninstall", {});
			renderAlarms();
		}, "Будильник удалён с колонки");
	};
	$("#al-snooze-cancel").onclick = (e) => act(e.currentTarget, async () => {
		await api("/api/alarms/cmd", { action: "cancel_snooze" });
		await loadAlarms();
	}, "Отложенный будильник отменён");
	$("#ab-stop").onclick = (e) => act(e.currentTarget, async () => {
		await api("/api/alarms/cmd", { action: "stop" });
		setTimeout(loadAlarms, 1500);
	}, "Будильник выключен");
	$("#ab-snooze").onclick = (e) => act(e.currentTarget, async () => {
		await api("/api/alarms/cmd", { action: "snooze" });
		setTimeout(loadAlarms, 1500);
	}, "Отложено");
	setInterval(() => {
		if (!online || document.hidden) return;
		const onTab = shownTab === "alarm";
		if (onTab || alarmsData?.state?.ringing || alarmsData?.installed && alarmsData.alarms.some((a) => a.on)) {
			if (onTab || Date.now() - (loadAlarms.t || 0) > 15e3 || alarmsData?.state?.ringing) {
				loadAlarms.t = Date.now();
				loadAlarms();
			}
		}
	}, 3e3);
	let panelVer = null;
	const UPD_HOW = {
		zip: "Панель скачает релиз с GitHub, заменит свои файлы и перезапустится. Вход в Яндекс, пароль, история и папка runtime сохранятся.",
		git: "Панель установлена через git: выполнит git pull и перезапустится.",
		docker: "Панель работает в Docker — образ обновляется снаружи командой ниже. Данные в томе /data сохранятся."
	};
	async function loadPanelModel() {
		let p;
		try {
			p = await api("/api/profile");
		} catch {
			return;
		}
		$("#upd-model").textContent = p.name;
		$("#upd-model-how").textContent = p.auto ? "Определена автоматически по плате колонки. Задать вручную — параметр --model" : `Задана вручную: --model ${p.id}. Определять автоматически — --model auto (так по умолчанию)`;
	}
	async function loadPanelVersion(refresh) {
		try {
			panelVer = await api("/api/panel/version" + (refresh ? "?refresh=1" : ""));
		} catch (e) {
			if (!e.offline) $("#upd-state").textContent = "Не удалось проверить обновления: " + e.message;
			throw e;
		}
		renderPanelVersion();
	}
	function renderPanelVersion() {
		const v = panelVer;
		if (!v) return;
		const date = (d) => d ? new Date(d).toLocaleDateString("ru-RU") : "";
		$("#upd-version").textContent = v.version;
		$("#upd-repo").href = v.repo;
		const checked = v.checked ? " · проверено " + (/* @__PURE__ */ new Date(v.checked * 1e3)).toLocaleTimeString("ru-RU") : "";
		$("#upd-state").textContent = v.error ? "Не удалось проверить: " + v.error : v.update ? "Доступна версия " + v.latest + checked : v.latest ? "Установлена последняя версия" + checked : "Нет данных о релизе";
		$("#upd-state").classList.toggle("warn", !!v.update || !!v.error);
		$("#upd-row").hidden = !v.update;
		if (v.update) {
			$("#upd-latest").textContent = v.latest + (v.latest_date ? ` от ${date(v.latest_date)}` : "");
			$("#upd-how").textContent = v.multi ? "Обновятся шлюз и все процессы колонок; данные сохранятся." : UPD_HOW[v.install] || "";
			$("#upd-notes").href = v.url || v.repo;
			$("#upd-go").hidden = v.install === "docker";
		}
		$("#upd-cmd").hidden = !(v.update && v.install === "docker");
		$("#upd-cmd").textContent = "docker compose pull && docker compose up -d";
		$("#ov-update").hidden = !v.update || store.get("upd.hide") === v.latest;
		$("#ov-update-text").textContent = `Доступна новая версия панели — ${v.latest}`;
	}
	$("#ov-update-hide").onclick = () => {
		store.set("upd.hide", panelVer?.latest || "");
		renderPanelVersion();
	};
	$("#upd-check").onclick = (e) => act(e.currentTarget, async () => {
		const btn = e.currentTarget;
		btn.textContent = "Проверяю…";
		$("#upd-state").textContent = "Проверяю релизы на GitHub…";
		try {
			await loadPanelVersion(true);
			if (!panelVer.error && !panelVer.update) toast("Проверено: установлена последняя версия");
		} finally {
			btn.textContent = "Проверить";
		}
	});
	$("#upd-go").onclick = (e) => {
		if (!confirm(`Обновить панель до ${panelVer.latest}? Сервер перезапустится, страница обновится сама.`)) return;
		const btn = e.currentTarget;
		return act(btn, async () => {
			btn.textContent = "Обновляем…";
			try {
				const updated = await api("/api/panel/update", {});
				toast("Обновлено, перезапускаемся…");
				const until = Date.now() + 6e4;
				await new Promise((r) => setTimeout(r, 2500));
				while (Date.now() < until) {
					try {
						const r = await PanelContext.fetch("/api/panel/version");
						if (r.status === 401 || r.ok && (await r.json()).version === updated.version) {
							location.reload();
							return;
						}
					} catch {}
					await new Promise((r) => setTimeout(r, 1e3));
				}
				throw new Error("Сервер не поднялся за минуту — запустите панель вручную");
			} finally {
				btn.textContent = "Обновить";
			}
		});
	};
	loadPanelVersion().catch(() => {});
	setInterval(() => !document.hidden && loadPanelVersion().catch(() => {}), 216e5);
	let connInfo = null, retryDeadline = 0, connTimer;
	const CONN_TEXT = {
		server: [
			"Сервер панели не отвечает",
			"Проверьте, что DARKLS Alice Panel запущена, — страница переподключится сама.",
			""
		],
		connecting: [
			"Подключаемся к колонке",
			"Устанавливаем соединение по adb…",
			""
		],
		waiting: [
			"Ожидание колонки",
			"Колонка пока не в сети: включите её или проверьте Wi‑Fi. Панель подключится сама, как только она появится.",
			"wait"
		],
		adb_error: [
			"Нет подключения по adb",
			"Колонка в сети, но adb не отвечает.",
			"err"
		],
		locked: [
			"Вход в панель",
			"Панель защищена паролем.",
			"lock"
		]
	};
	function renderConn() {
		const i = connInfo || { state: "connecting" };
		const [title, text, ring] = CONN_TEXT[i.state] || CONN_TEXT.connecting;
		$("#cs-title").textContent = title;
		let more = "";
		if (i.state === "adb_error") {
			const left = Math.max(0, Math.ceil((retryDeadline - Date.now()) / 1e3));
			more = left ? ` Переподключение через ${left} с.` : " Переподключаемся…";
			if (i.attempts > 1) more += ` Попытка ${i.attempts}.`;
		}
		$("#cs-text").textContent = text + more;
		$("#cs-addr").innerHTML = i.serial ? secret("ip", i.serial) : "";
		$("#cs-ring").className = "conn-ring" + (ring ? " " + ring : "");
		$("#cs-ring").innerHTML = i.state === "locked" ? icon("i-lock", 28) : "";
		const locked = i.state === "locked", form = $("#cs-login");
		if (form.hidden === locked) {
			form.hidden = !locked;
			if (locked) setTimeout(() => $("#cs-pass").focus(), 0);
		}
		$("#cs-retry").hidden = !["adb_error", "waiting"].includes(i.state);
		$("#cs-log-box").hidden = !(i.log && i.log.length);
		if (i.log) {
			const p = (x) => String(x).padStart(2, "0");
			$("#cs-log").textContent = i.log.map((l) => {
				const d = /* @__PURE__ */ new Date(l.t * 1e3);
				return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}  ${l.level === "warn" ? "⚠ " : ""}${l.msg}`;
			}).join("\n");
		}
		$("#conn-box").hidden = !online;
	}
	async function connCheck() {
		clearTimeout(connTimer);
		try {
			const r = await PanelContext.fetch("/api/conn");
			connInfo = r.status === 401 ? { state: "locked" } : await r.json();
		} catch {
			connInfo = { state: "server" };
		}
		if (connInfo.retry_in != null) retryDeadline = Date.now() + connInfo.retry_in * 1e3;
		const was = online;
		online = connInfo.state === "online";
		context.onConnection(online);
		renderConn();
		if (online !== was) {
			online ? onConnected() : showTab();
			updateMinibar();
		}
		connTimer = setTimeout(connCheck, online ? 3e3 : connInfo.state === "locked" ? 1e4 : 1e3);
	}
	setInterval(() => connInfo?.state === "adb_error" && renderConn(), 1e3);
	$("#cs-login").onsubmit = async (e) => {
		e.preventDefault();
		const btn = $("#cs-login-btn"), err = $("#cs-login-err");
		btn.disabled = true;
		err.textContent = "";
		try {
			const r = await PanelContext.fetch("/api/panel-auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: $("#cs-pass").value })
			});
			const d = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(d.error || r.statusText);
			$("#cs-pass").value = "";
			await connCheck();
			loadAccess();
		} catch (x) {
			err.textContent = x.message;
			$("#cs-pass").select();
		} finally {
			btn.disabled = false;
		}
	};
	$("#cs-retry").onclick = (e) => act(e.currentTarget, async () => {
		await PanelContext.fetch("/api/conn/retry", { method: "POST" });
		await connCheck();
	});
	let statusTimer;
	function onConnected() {
		fs.loaded = false;
		logsLoaded = false;
		bootLoaded = false;
		showTab();
		refreshStatus();
		clearInterval(statusTimer);
		statusTimer = setInterval(refreshStatus, 5e3);
		loadSounds().catch((e) => {
			if (!e.offline) $("#sounds").innerHTML = `<div class="empty">${esc(e.message)}</div>`;
		});
		api("/api/patterns").then((p) => {
			patterns = p;
			renderPatterns();
		}).catch((e) => e.offline || toast(e.message, true));
		loadMusic();
		loadDispState();
		loadAlarms();
		loadBt();
	}
	renderConn();
	connCheck();
	showTab();
	listen(window, "darkls:authchanged", connCheck);
	return {
		showTab,
		dispose() {
			scope.abort();
			for (const id of timers) window.clearTimeout(id);
			for (const id of intervals) window.clearInterval(id);
			for (const id of frames) window.cancelAnimationFrame(id);
			for (const observer of observers) observer.disconnect();
			for (const [target, event, fn, options] of listeners) target.removeEventListener(event, fn, options);
			try {
				const ws = termWs;
				termWs = null;
				ws?.close();
				term?.dispose();
			} catch {}
		}
	};
}
// src/composables/api.ts
function contextUrl(path) {
	return window.PanelContext?.url(path) || path;
}
function useApi() {
	const scope = new AbortController();
	onBeforeUnmount(() => scope.abort());
	return async function api(path, body, options = {}) {
		const request = new AbortController(), cancel = () => request.abort();
		scope.signal.addEventListener("abort", cancel, { once: true });
		if (scope.signal.aborted) request.abort();
		const timeout = setTimeout(() => request.abort(), options.timeout || 13e4);
		const signal = request.signal;
		try {
			const response = await fetch(contextUrl(path), {
				cache: "no-store",
				signal,
				...body === void 0 ? {} : {
					method: "POST",
					headers: {
						"Content-Type": options.raw ? "application/octet-stream" : "application/json",
						...options.headers
					},
					body: options.raw ? body : JSON.stringify(body)
				}
			});
			const value = await response.json();
			if (!response.ok) {
				if (response.status === 401) window.dispatchEvent(new Event("panel:login-required"));
				throw Error(value.error || `HTTP ${response.status}`);
			}
			return value;
		} finally {
			clearTimeout(timeout);
			scope.signal.removeEventListener("abort", cancel);
		}
	};
}
function useEvents(load, events = ["hashchange", "darkls:authchanged"]) {
	onMounted(() => events.forEach((e) => window.addEventListener(e, load)));
	onBeforeUnmount(() => events.forEach((e) => window.removeEventListener(e, load)));
}
function usePolling(load, ms, when = () => true) {
	onMounted(() => {
		load();
		const timer = setInterval(() => {
			if (!document.hidden && when()) load();
		}, ms);
		onStop = () => clearInterval(timer);
	});
	let onStop = () => {};
	onBeforeUnmount(() => onStop());
}
function useAction(message = /* @__PURE__ */ ref("")) {
	const busy = /* @__PURE__ */ ref(false);
	async function run(action) {
		if (busy.value) return;
		busy.value = true;
		message.value = "Выполняется…";
		try {
			await action();
		} catch (e) {
			message.value = e instanceof Error ? e.message : String(e);
		} finally {
			busy.value = false;
		}
	}
	return {
		busy,
		message,
		run
	};
}
var stamp = (n) => n ? (/* @__PURE__ */ new Date(n * 1e3)).toLocaleString("ru-RU") : "Ещё не выполнялась";
function download(blob, name) {
	const url = URL.createObjectURL(blob), a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 3e4);
}
// src/composables/useDeviceControls.ts
var loaded = /* @__PURE__ */ new Map();
function script(name) {
	if (!loaded.has(name)) loaded.set(name, new Promise((resolve, reject) => {
		const s = document.createElement("script");
		s.src = contextUrl("/static/" + name);
		s.onload = () => resolve();
		s.onerror = () => reject(Error("Не удалось загрузить " + name));
		document.head.append(s);
	}));
	return loaded.get(name);
}
function useDeviceControls() {
	let controller, stopped = false;
	const stopWatch = watch(() => route.active, () => controller?.showTab(), { flush: "post" });
	onBeforeUnmount(() => {
		stopped = true;
		stopWatch();
		controller?.dispose();
	});
	return async () => {
		await script("vendor/qrcode.js");
		await script("vendor/xterm/xterm.js");
		await script("vendor/xterm/addon-fit.js");
		await script("ui-kit.js");
		if (stopped) return;
		controller = createDeviceControls({
			active: () => route.active,
			onConnection: (value) => {
				online.value = value;
			}
		});
		script("speaker-selector.js").catch(console.warn);
		import(
			/* @vite-ignore */
			contextUrl("/static/model.js")
).catch((e) => console.warn("Модель устройства:", e));
	};
}
// \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
// src/components/IconSprite.vue
var _sfc_main$10 = {};
var _hoisted_1$19 = {
	width: "0",
	height: "0",
	style: { "position": "absolute" },
	"aria-hidden": "true"
};
function _sfc_render$10(_ctx, _cache) {
	return openBlock(), createElementBlock("svg", _hoisted_1$19, [..._cache[0] || (_cache[0] = [createStaticVNode("<defs><symbol id=\"i-grid\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"></rect></g></symbol><symbol id=\"i-folder\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" d=\"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"></path></symbol><symbol id=\"i-file\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"></path><path d=\"M14 3v6h6\"></path></g></symbol><symbol id=\"i-log\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"></path><path d=\"M14 3v6h6M8 13h8M8 17h5\"></path></g></symbol><symbol id=\"i-term\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4 17l6-5-6-5M12 19h8\"></path></symbol><symbol id=\"i-music\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 18V5l12-2v13\"></path><circle cx=\"6\" cy=\"18\" r=\"3\"></circle><circle cx=\"18\" cy=\"16\" r=\"3\"></circle></g></symbol><symbol id=\"i-link\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7\"></path><path d=\"M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7\"></path></g></symbol><symbol id=\"i-play\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M7 4.5v15l13-7.5z\"></path></symbol><symbol id=\"i-stop\" viewBox=\"0 0 24 24\"><rect fill=\"currentColor\" x=\"5\" y=\"5\" width=\"14\" height=\"14\" rx=\"2\"></rect></symbol><symbol id=\"i-refresh\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a9 9 0 1 1-3-6.7L21 8\"></path><path d=\"M21 3v5h-5\"></path></g></symbol><symbol id=\"i-power\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M12 2v10\"></path><path d=\"M18.4 6.6a9 9 0 1 1-12.8 0\"></path></g></symbol><symbol id=\"i-search\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"11\" cy=\"11\" r=\"7\"></circle><path d=\"M20 20l-3.5-3.5\"></path></g></symbol><symbol id=\"i-bt\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M7 7l10 10-5 5V2l5 5L7 17\"></path></symbol><symbol id=\"i-up\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 19V5M5 12l7-7 7 7\"></path></symbol><symbol id=\"i-dl\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 4v11M7 10l5 5 5-5M5 20h14\"></path></symbol><symbol id=\"i-ul\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 16V5M7 10l5-5 5 5M5 20h14\"></path></symbol><symbol id=\"i-edit\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4\"></path></symbol><symbol id=\"i-trash\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3\"></path></symbol><symbol id=\"i-box\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 8l-9-5-9 5 9 5 9-5z\"></path><path d=\"M3 8v8l9 5 9-5V8M12 13v8\"></path></g></symbol><symbol id=\"i-pause\" viewBox=\"0 0 24 24\"><g fill=\"currentColor\"><rect x=\"6\" y=\"5\" width=\"4\" height=\"14\" rx=\"1\"></rect><rect x=\"14\" y=\"5\" width=\"4\" height=\"14\" rx=\"1\"></rect></g></symbol><symbol id=\"i-prev\" viewBox=\"0 0 24 24\"><g fill=\"currentColor\"><path d=\"M18 5.5v13L9 12z\"></path><rect x=\"5\" y=\"5\" width=\"2.5\" height=\"14\" rx=\"1\"></rect></g></symbol><symbol id=\"i-next\" viewBox=\"0 0 24 24\"><g fill=\"currentColor\"><path d=\"M6 5.5v13l9-6.5z\"></path><rect x=\"16.5\" y=\"5\" width=\"2.5\" height=\"14\" rx=\"1\"></rect></g></symbol><symbol id=\"i-shuffle\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16 4h4v4M4 20L20 4M20 16v4h-4M15 15l5 5M4 4l5 5\"></path></symbol><symbol id=\"i-repeat\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4\"></path></symbol><symbol id=\"i-like\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" d=\"M12 20s-7-4.4-9-9.2C1.7 7.6 3.8 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.2 0 5.3 3.1 4 6.3C19 15.6 12 20 12 20z\"></path></symbol><symbol id=\"i-dislike\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M5.6 5.6l12.8 12.8\"></path></g></symbol><symbol id=\"i-vol\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 9v6h4l5 4V5L8 9z\"></path><path d=\"M16.5 8.5a5 5 0 0 1 0 7\"></path></g></symbol><symbol id=\"i-expand\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7\"></path></symbol><symbol id=\"i-gear\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"></circle><path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z\"></path></g></symbol><symbol id=\"i-palette\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9l-.3-.9c-.4-1.2.5-2.2 1.7-2.2H17a4 4 0 0 0 4-4c0-5-4-9-9-9z\"></path><circle cx=\"7.5\" cy=\"11\" r=\"1\"></circle><circle cx=\"10\" cy=\"7\" r=\"1\"></circle><circle cx=\"15\" cy=\"7.5\" r=\"1\"></circle></g></symbol><symbol id=\"i-chart\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4 4v16h16M7 15l4-5 3 3 5-6\"></path></symbol><symbol id=\"i-alarm\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"13\" r=\"8\"></circle><path d=\"M12 9v4l2.5 2M5 3 2 6M19 3l3 3\"></path></g></symbol><symbol id=\"i-lock\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"10\" width=\"16\" height=\"11\" rx=\"2\"></rect><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"></path></g></symbol><symbol id=\"i-plus\" viewBox=\"0 0 24 24\"><path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" d=\"M12 5v14M5 12h14\"></path></symbol><symbol id=\"i-home\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9\"></path></g></symbol><symbol id=\"i-update\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5\"></path></g></symbol><symbol id=\"i-chat\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8zM8 11h.01M12 11h.01M16 11h.01\"></path></g></symbol><symbol id=\"i-archive\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 3h18v5H3zM5 8v13h14V8M10 12h4\"></path></g></symbol><symbol id=\"i-shield\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6\"></path></g></symbol><symbol id=\"i-check\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12l4 4L19 6\"></path></g></symbol><symbol id=\"i-close\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 6l12 12M6 18 18 6\"></path></g></symbol><symbol id=\"i-info\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 11v6M12 7h.01\"></path></g></symbol><symbol id=\"i-layers\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m3 7 9-5 9 5-9 5zM3 12l9 5 9-5M3 17l9 5 9-5\"></path></g></symbol><symbol id=\"i-undo\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 10h11a6 6 0 0 1 0 12M3 10l6-6M3 10l6 6\"></path></g></symbol><symbol id=\"i-arrow-right\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14M13 6l6 6-6 6\"></path></g></symbol><symbol id=\"i-server\" viewBox=\"0 0 24 24\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 3h16v7H4zM4 14h16v7H4zM8 6.5h.01M8 17.5h.01\"></path></g></symbol></defs>", 1)])]);
}
var IconSprite_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$10, [["render", _sfc_render$10]]);
// src/components/Sidebar.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$18 = { class: "sidebar" };
var _hoisted_2$17 = {
	class: "mobile-nav",
	"aria-label": "Быстрая навигация"
};
var _hoisted_3$14 = ["href", "aria-current"];
var _hoisted_4$13 = ["aria-expanded"];
var _hoisted_5$12 = { class: "conn" };
var _hoisted_6$12 = { id: "sidebar-text" };
// src/components/Sidebar.vue
var Sidebar_default = /* @__PURE__ */ defineComponent({
	__name: "Sidebar",
	setup(__props) {
		const more = /* @__PURE__ */ ref(false);
		watch(() => route.active, () => {
			more.value = false;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("aside", _hoisted_1$18, [
				_cache[27] || (_cache[27] = createBaseVNode("a", {
					class: "brand",
					href: "#home",
					title: "На «Обзор»"
				}, [createBaseVNode("svg", {
					class: "brand-logo",
					viewBox: "-50 -50 100 100",
					"aria-hidden": "true"
				}, [createBaseVNode("path", {
					"fill-rule": "evenodd",
					d: "M0-46a46 46 0 1 1 0 92a46 46 0 1 1 0-92ZM0-25c3.5 0 5.6 2 7.6 5.5l13 22.5c2 3.5 2 6.4.3 9.3c-1.8 3-4.4 4.2-8.4 4.2h-25c-4 0-6.6-1.2-8.4-4.2c-1.7-2.9-1.7-5.8.3-9.3l13-22.5C-5.6-23-3.5-25 0-25Z"
				})]), createBaseVNode("div", null, [createBaseVNode("b", { id: "model-name" }, "Станция Лайт 2"), createBaseVNode("small", null, "DARKLS Alice Panel")])], -1)),
				createBaseVNode("nav", {
					id: "side-sections",
					class: normalizeClass(["side", { "mobile-open": more.value }]),
					"aria-label": "Разделы",
					onClick: _cache[0] || (_cache[0] = ($event) => more.value = false),
					onKeydown: _cache[1] || (_cache[1] = withKeys(($event) => more.value = false, ["esc"]))
				}, [
					createBaseVNode("a", {
						href: "#home",
						"data-tab": "home",
						"data-view": "home",
						class: normalizeClass({ active: unref(route).active === "home" })
					}, [..._cache[4] || (_cache[4] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-home" })], -1), createTextVNode("Главная", -1)])], 2),
					createBaseVNode("a", {
						href: "#overview",
						"data-tab": "overview",
						"data-view": "overview",
						class: normalizeClass({ active: unref(route).active === "overview" })
					}, [..._cache[5] || (_cache[5] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-grid" })], -1), createTextVNode("Обзор", -1)])], 2),
					createBaseVNode("a", {
						href: "#player",
						"data-tab": "player",
						"data-view": "player",
						class: normalizeClass({ active: unref(route).active === "player" })
					}, [..._cache[6] || (_cache[6] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-music" })], -1), createTextVNode("Плеер", -1)])], 2),
					_cache[22] || (_cache[22] = createBaseVNode("div", {
						class: "nav-group",
						role: "presentation"
					}, "Колонка", -1)),
					createBaseVNode("a", {
						href: "#scenes",
						"data-tab": "scenes",
						"data-view": "scenes",
						class: normalizeClass({ active: unref(route).active === "scenes" })
					}, [..._cache[7] || (_cache[7] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-layers" })], -1), createTextVNode("Сценарии", -1)])], 2),
					createBaseVNode("a", {
						href: "#wakeword",
						"data-tab": "wakeword",
						"data-view": "wakeword",
						class: normalizeClass({ active: unref(route).active === "wakeword" })
					}, [..._cache[8] || (_cache[8] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-chat" })], -1), createTextVNode("Активация", -1)])], 2),
					createBaseVNode("a", {
						href: "#alarm",
						"data-tab": "alarm",
						"data-view": "alarm",
						class: normalizeClass({ active: unref(route).active === "alarm" })
					}, [..._cache[9] || (_cache[9] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-alarm" })], -1), createTextVNode("Будильник", -1)])], 2),
					createBaseVNode("a", {
						href: "#boot",
						"data-tab": "boot",
						"data-view": "boot",
						class: normalizeClass({ active: unref(route).active === "boot" })
					}, [..._cache[10] || (_cache[10] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-power" })], -1), createTextVNode("Запуск", -1)])], 2),
					createBaseVNode("a", {
						href: "#apps",
						"data-tab": "apps",
						"data-view": "apps",
						class: normalizeClass({ active: unref(route).active === "apps" })
					}, [..._cache[11] || (_cache[11] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-box" })], -1), createTextVNode("Приложения", -1)])], 2),
					createBaseVNode("a", {
						href: "#yam",
						"data-tab": "yam",
						"data-view": "yam",
						class: normalizeClass({ active: unref(route).active === "yam" })
					}, [..._cache[12] || (_cache[12] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-layers" })], -1), createTextVNode("YAM v2", -1)])], 2),
					createBaseVNode("a", {
						href: "#files",
						"data-tab": "files",
						"data-view": "files",
						class: normalizeClass({ active: unref(route).active === "files" })
					}, [..._cache[13] || (_cache[13] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-folder" })], -1), createTextVNode("Файлы", -1)])], 2),
					createBaseVNode("a", {
						href: "#console",
						"data-tab": "console",
						"data-view": "console",
						class: normalizeClass({ active: unref(route).active === "console" })
					}, [..._cache[14] || (_cache[14] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-term" })], -1), createTextVNode("Консоль", -1)])], 2),
					_cache[23] || (_cache[23] = createBaseVNode("div", {
						class: "nav-group",
						role: "presentation"
					}, "Состояние", -1)),
					createBaseVNode("a", {
						href: "#charts",
						"data-tab": "charts",
						"data-view": "charts",
						class: normalizeClass({ active: unref(route).active === "charts" })
					}, [..._cache[15] || (_cache[15] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-chart" })], -1), createTextVNode("Графики", -1)])], 2),
					createBaseVNode("a", {
						href: "#logs",
						"data-tab": "logs",
						"data-view": "logs",
						class: normalizeClass({ active: unref(route).active === "logs" })
					}, [..._cache[16] || (_cache[16] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-log" })], -1), createTextVNode("Логи", -1)])], 2),
					_cache[24] || (_cache[24] = createBaseVNode("div", {
						class: "nav-sep",
						role: "presentation"
					}, null, -1)),
					_cache[25] || (_cache[25] = createBaseVNode("div", {
						class: "nav-group",
						role: "presentation"
					}, "Обслуживание", -1)),
					createBaseVNode("a", {
						href: "#diagnostics",
						"data-tab": "diagnostics",
						"data-view": "diagnostics",
						class: normalizeClass({ active: unref(route).active === "diagnostics" })
					}, [..._cache[17] || (_cache[17] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-shield" })], -1), createTextVNode("Диагностика", -1)])], 2),
					createBaseVNode("a", {
						href: "#updates",
						"data-tab": "updates",
						"data-view": "updates",
						class: normalizeClass({ active: unref(route).active === "updates" })
					}, [..._cache[18] || (_cache[18] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-update" })], -1), createTextVNode("Обновления панели", -1)])], 2),
					createBaseVNode("a", {
						href: "#chatgpt",
						"data-tab": "chatgpt",
						"data-view": "chatgpt",
						class: normalizeClass({ active: unref(route).active === "chatgpt" })
					}, [..._cache[19] || (_cache[19] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-chat" })], -1), createTextVNode("ChatGPT", -1)])], 2),
					createBaseVNode("a", {
						href: "#backups",
						"data-tab": "backups",
						"data-view": "backups",
						class: normalizeClass({ active: unref(route).active === "backups" })
					}, [..._cache[20] || (_cache[20] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-archive" })], -1), createTextVNode("Резервные копии", -1)])], 2),
					createBaseVNode("a", {
						href: "#settings",
						"data-tab": "settings",
						"data-view": "settings",
						class: normalizeClass({ active: unref(route).active === "settings" })
					}, [..._cache[21] || (_cache[21] = [createBaseVNode("svg", {
						width: "20",
						height: "20",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-gear" })], -1), createTextVNode("Настройки", -1)])], 2)
				], 34),
				createBaseVNode("nav", _hoisted_2$17, [(openBlock(), createElementBlock(Fragment, null, renderList({
					home: "Главная",
					overview: "Обзор",
					player: "Плеер"
				}, (label, key) => {
					return createBaseVNode("a", {
						key,
						href: "#" + key,
						"aria-current": unref(route).active === key ? "page" : void 0,
						onClick: _cache[2] || (_cache[2] = ($event) => more.value = false)
					}, toDisplayString(label), 9, _hoisted_3$14);
				}), 64)), createBaseVNode("button", {
					type: "button",
					"aria-controls": "side-sections",
					"aria-expanded": more.value,
					onClick: _cache[3] || (_cache[3] = ($event) => more.value = !more.value)
				}, "Ещё", 8, _hoisted_4$13)]),
				_cache[28] || (_cache[28] = createBaseVNode("div", {
					class: "conn",
					id: "conn-box",
					hidden: ""
				}, [createBaseVNode("b", null, [createBaseVNode("span", {
					class: "dot",
					id: "conn"
				}), createBaseVNode("span", { id: "conn-text" }, "Подключение…")]), createBaseVNode("small", { id: "conn-ip" }, "—")], -1)),
				createBaseVNode("div", _hoisted_5$12, [createBaseVNode("b", null, [createBaseVNode("span", {
					class: normalizeClass(["status-dot", unref(health).info && !unref(health).error ? "good" : "bad"]),
					id: "sidebar-status"
				}, null, 2), createBaseVNode("span", _hoisted_6$12, toDisplayString(unref(health).error ? "Нет связи" : unref(health).info ? "Локальный доступ" : "Проверяем связь"), 1)]), _cache[26] || (_cache[26] = createBaseVNode("small", null, "Локальное управление", -1))]),
				_cache[29] || (_cache[29] = createBaseVNode("button", {
					id: "menu-button",
					hidden: "",
					"aria-label": "Меню"
				}, null, -1)),
				_cache[30] || (_cache[30] = createBaseVNode("span", {
					id: "breadcrumb",
					hidden: ""
				}, null, -1))
			]);
		};
	}
});
// src/components/DeviceOverlays.vue
var _sfc_main$9 = {};
function _sfc_render$9(_ctx, _cache) {
	return openBlock(), createElementBlock(Fragment, null, [
		_cache[0] || (_cache[0] = createStaticVNode("<div class=\"minibar\" id=\"minibar\" hidden><div class=\"mb-track\"><a class=\"mb-cover mu-cover\" href=\"#player\" title=\"Открыть плеер\"><svg width=\"22\" height=\"22\" aria-hidden=\"true\"><use href=\"#i-music\"></use></svg></a><a class=\"mb-text\" href=\"#player\" title=\"Открыть плеер\"><b class=\"mu-title\">—</b><span class=\"mu-artist\"></span></a><button class=\"cbtn\" data-mu=\"like\" aria-label=\"Лайк\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-like\"></use></svg></button></div><div class=\"mb-center\"><div class=\"controls\" data-mu-controls=\"bar\"></div><div class=\"progress\"><span class=\"mu-pos\">0:00</span><input type=\"range\" class=\"mu-seek\" min=\"0\" max=\"100\" value=\"0\" step=\"1\" aria-label=\"Позиция в треке\"><span class=\"mu-dur\">0:00</span></div></div><div class=\"mb-right\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-vol\"></use></svg><input type=\"range\" class=\"mu-vol\" min=\"0\" max=\"100\" step=\"5\" aria-label=\"Громкость\"><a class=\"cbtn\" href=\"#player\" aria-label=\"Открыть плеер\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-expand\"></use></svg></a></div></div>", 1)),
		_cache[1] || (_cache[1] = createBaseVNode("div", {
			id: "toast",
			role: "status",
			"aria-live": "polite"
		}, null, -1)),
		_cache[2] || (_cache[2] = createBaseVNode("div", {
			id: "alarm-bar",
			role: "alert",
			hidden: ""
		}, [
			createBaseVNode("svg", {
				class: "ring-ic",
				width: "22",
				height: "22",
				"aria-hidden": "true"
			}, [createBaseVNode("use", { href: "#i-alarm" })]),
			createBaseVNode("div", null, [createBaseVNode("b", { id: "ab-title" }, "Будильник звенит"), createBaseVNode("div", {
				style: {
					"font-size": "12.5px",
					"opacity": ".85"
				},
				id: "ab-sub"
			})]),
			createBaseVNode("div", { class: "actions" }, [createBaseVNode("button", {
				class: "btn sm",
				id: "ab-snooze"
			}, "Отложить"), createBaseVNode("button", {
				class: "btn sm primary",
				id: "ab-stop"
			}, "Выключить")])
		], -1))
	], 64);
}
var DeviceOverlays_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$9, [["render", _sfc_render$9]]);
// src/components/UiIcon.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$17 = ["width", "height"];
var _hoisted_2$16 = ["href"];
// src/components/UiIcon.vue
var UiIcon_default = /* @__PURE__ */ defineComponent({
	__name: "UiIcon",
	props: {
		name: {},
		size: { default: 18 }
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("svg", {
				class: "ui-icon",
				width: __props.size,
				height: __props.size,
				"aria-hidden": "true",
				focusable: "false"
			}, [createBaseVNode("use", { href: "#i-" + __props.name }, null, 8, _hoisted_2$16)], 8, _hoisted_1$17);
		};
	}
});
// src/components/LoginDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$16 = {
	id: "login-error",
	role: "alert"
};
var _hoisted_2$15 = ["disabled"];
// src/components/LoginDialog.vue
var LoginDialog_default = /* @__PURE__ */ defineComponent({
	__name: "LoginDialog",
	setup(__props) {
		const dialog = /* @__PURE__ */ ref(), password = /* @__PURE__ */ ref(""), error = /* @__PURE__ */ ref(""), busy = /* @__PURE__ */ ref(false), api = useApi();
		function open() {
			if (!dialog.value?.open) dialog.value?.showModal();
		}
		async function login() {
			if (busy.value) return;
			busy.value = true;
			error.value = "";
			try {
				await api("/api/panel-auth/login", { password: password.value });
				password.value = "";
				dialog.value?.close();
				dispatchEvent(new Event("darkls:authchanged"));
			} catch (e) {
				error.value = e.message;
			} finally {
				busy.value = false;
			}
		}
		onMounted(() => addEventListener("panel:login-required", open));
		onBeforeUnmount(() => removeEventListener("panel:login-required", open));
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("dialog", {
				id: "login-dialog",
				ref_key: "dialog",
				ref: dialog,
				onCancel: _cache[1] || (_cache[1] = withModifiers(() => {}, ["prevent"]))
			}, [createBaseVNode("form", {
				id: "login-form",
				onSubmit: withModifiers(login, ["prevent"])
			}, [
				createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "lock" }), _cache[2] || (_cache[2] = createTextVNode("Вход в панель", -1))]),
				_cache[4] || (_cache[4] = createBaseVNode("p", { class: "hint" }, "Введи пароль панели.", -1)),
				withDirectives(createBaseVNode("input", {
					id: "login-password",
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => password.value = $event),
					class: "field",
					type: "password",
					autocomplete: "current-password",
					placeholder: "Пароль",
					required: ""
				}, null, 512), [[vModelText, password.value]]),
				createBaseVNode("p", _hoisted_1$16, toDisplayString(error.value), 1),
				createBaseVNode("button", {
					class: "btn primary",
					type: "submit",
					disabled: busy.value
				}, [createVNode(UiIcon_default, { name: "lock" }), _cache[3] || (_cache[3] = createTextVNode("Войти", -1))], 8, _hoisted_2$15)
			], 32)], 544);
		};
	}
});
// src/pages/HomePage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$15 = { class: "page-head" };
var _hoisted_2$14 = {
	class: "sub",
	id: "station-address"
};
var _hoisted_3$13 = { class: "actions" };
var _hoisted_4$12 = {
	class: "badge",
	id: "hero-status"
};
var _hoisted_5$11 = ["hidden"];
var _hoisted_6$11 = { class: "card" };
var _hoisted_7$11 = { class: "card-head" };
var _hoisted_8$11 = {
	class: "badge",
	id: "y2-home-version"
};
var _hoisted_9$11 = {
	class: "btn primary",
	href: "#yam"
};
var _hoisted_10$10 = { class: "card" };
var _hoisted_11$10 = { class: "card-head" };
var _hoisted_12$10 = {
	class: "native-state",
	id: "adb-state"
};
var _hoisted_13$9 = {
	class: "hint",
	id: "adb-detail"
};
var _hoisted_14$7 = {
	class: "btn",
	href: "#console"
};
var _hoisted_15$6 = { class: "card" };
var _hoisted_16$6 = { class: "card-head" };
var _hoisted_17$6 = {
	class: "meta",
	id: "hero-platform"
};
var _hoisted_18$6 = { class: "row" };
var _hoisted_19$5 = ["href"];
var _hoisted_20$4 = { class: "cols" };
var _hoisted_21$4 = { class: "card" };
var _hoisted_22$3 = { class: "card-head" };
var _hoisted_23$3 = {
	class: "badge",
	id: "home-count"
};
var _hoisted_24$2 = {
	class: "btn sm",
	href: "#apps"
};
var _hoisted_25$2 = {
	id: "home-packages",
	class: "placeholder"
};
var _hoisted_26$2 = { href: "#apps" };
var _hoisted_27$2 = {
	key: 0,
	class: "hint"
};
var _hoisted_28$2 = { class: "card" };
var _hoisted_29$2 = { class: "card-head" };
var _hoisted_30$2 = { id: "sensors" };
// src/pages/HomePage.vue
var HomePage_default = /* @__PURE__ */ defineComponent({
	__name: "HomePage",
	setup(__props) {
		const host = location.host, api = useApi(), sensors = /* @__PURE__ */ ref([]);
		async function load() {
			try {
				health.info = await api("/api/darkls/health");
				health.error = "";
				sensors.value = await api("/api/darkls/sensors");
			} catch (e) {
				health.error = e.message;
			}
		}
		usePolling(load, 1e4);
		useEvents(() => void load(), ["darkls:authchanged"]);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$15, [createBaseVNode("div", null, [createBaseVNode("h1", null, [createVNode(UiIcon_default, {
					name: "home",
					size: 24
				}), _cache[0] || (_cache[0] = createTextVNode("Главная", -1))]), createBaseVNode("div", _hoisted_2$14, toDisplayString(unref(health).info ? unref(host) : "Подключение…"), 1)]), createBaseVNode("div", _hoisted_3$13, [createBaseVNode("span", _hoisted_4$12, toDisplayString(unref(health).info ? "● Панель работает на колонке" : "Проверяем связь"), 1), createBaseVNode("button", {
					class: "btn",
					"data-refresh": "",
					onClick: load
				}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[1] || (_cache[1] = createTextVNode("Обновить", -1))])])]),
				createBaseVNode("div", {
					id: "connection-error",
					class: "card hint",
					role: "status",
					hidden: !unref(health).error
				}, toDisplayString(unref(health).error), 9, _hoisted_5$11),
				createBaseVNode("section", _hoisted_6$11, [
					createBaseVNode("div", _hoisted_7$11, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "box" }), _cache[2] || (_cache[2] = createTextVNode("YAM v2", -1))]), createBaseVNode("span", _hoisted_8$11, toDisplayString(unref(yamVersion)), 1)]),
					_cache[4] || (_cache[4] = createBaseVNode("p", { class: "hint" }, "Актуальный менеджер пакетов .yampkg работает прямо на колонке.", -1)),
					createBaseVNode("a", _hoisted_9$11, [createVNode(UiIcon_default, { name: "layers" }), _cache[3] || (_cache[3] = createTextVNode("Открыть YAM v2", -1))])
				]),
				createBaseVNode("section", _hoisted_10$10, [
					createBaseVNode("div", _hoisted_11$10, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[5] || (_cache[5] = createTextVNode("Локальный доступ", -1))]), createBaseVNode("span", {
						class: normalizeClass(["status-dot", unref(health).info && !unref(health).error ? "good" : "bad"]),
						id: "adb-dot"
					}, null, 2)]),
					createBaseVNode("strong", _hoisted_12$10, toDisplayString(unref(health).info ? "Готов" : "Проверка…"), 1),
					createBaseVNode("p", _hoisted_13$9, toDisplayString(unref(health).info ? "Панель управляет колонкой локально; ADB и yamd не требуются." : "Панель работает на колонке"), 1),
					createBaseVNode("a", _hoisted_14$7, [createVNode(UiIcon_default, { name: "term" }), _cache[6] || (_cache[6] = createTextVNode("Консоль", -1))])
				]),
				createBaseVNode("section", _hoisted_15$6, [
					createBaseVNode("div", _hoisted_16$6, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[7] || (_cache[7] = createTextVNode("Управление колонкой", -1))]), createBaseVNode("span", _hoisted_17$6, toDisplayString(unref(health).info?.device?.model || "Мини 3 Про") + " · " + toDisplayString(unref(health).info?.device?.platform || "pickle"), 1)]),
					createBaseVNode("div", _hoisted_18$6, [(openBlock(), createElementBlock(Fragment, null, renderList([
						[
							"overview",
							"grid",
							"Открыть обзор"
						],
						[
							"player",
							"music",
							"Открыть плеер"
						],
						[
							"files",
							"folder",
							"Файлы"
						],
						[
							"charts",
							"chart",
							"Графики"
						],
						[
							"settings",
							"gear",
							"Настройки"
						]
					], (v) => {
						return createBaseVNode("a", {
							key: v[0],
							class: normalizeClass(["btn", { primary: v[0] === "overview" }]),
							href: "#" + v[0]
						}, [createVNode(UiIcon_default, { name: v[1] }, null, 8, ["name"]), createTextVNode(toDisplayString(v[2]), 1)], 10, _hoisted_19$5);
					}), 64))]),
					_cache[8] || (_cache[8] = createBaseVNode("p", { class: "hint" }, "Все разделы открываются здесь. Управление идёт локально; ПК, ADB и yamd не требуются.", -1))
				]),
				createBaseVNode("div", _hoisted_20$4, [createBaseVNode("article", _hoisted_21$4, [createBaseVNode("div", _hoisted_22$3, [createBaseVNode("h2", null, [
					createVNode(UiIcon_default, { name: "box" }),
					_cache[9] || (_cache[9] = createTextVNode("Пакеты YAM ", -1)),
					createBaseVNode("span", _hoisted_23$3, toDisplayString(unref(packages).length), 1)
				]), createBaseVNode("a", _hoisted_24$2, [createVNode(UiIcon_default, { name: "box" }), _cache[10] || (_cache[10] = createTextVNode("Управлять", -1))])]), createBaseVNode("div", _hoisted_25$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(packages).slice(0, 4), (p) => {
					return openBlock(), createElementBlock("div", {
						key: p.name,
						class: "summary-row"
					}, [createBaseVNode("a", _hoisted_26$2, toDisplayString(p.name), 1), createBaseVNode("span", null, toDisplayString(p.version) + " · " + toDisplayString(p.services?.filter((s) => s.status === "running").length || 0) + " запущено", 1)]);
				}), 128)), !unref(packages).length ? (openBlock(), createElementBlock("p", _hoisted_27$2, [..._cache[11] || (_cache[11] = [createTextVNode("Приложений пока нет. ", -1), createBaseVNode("a", { href: "#yam" }, "Установить через YAM", -1)])])) : createCommentVNode("", true)])]), createBaseVNode("article", _hoisted_28$2, [
					createBaseVNode("div", _hoisted_29$2, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[12] || (_cache[12] = createTextVNode("Датчики", -1))]), _cache[13] || (_cache[13] = createBaseVNode("span", { class: "meta" }, "Данные ядра · sysfs", -1))]),
					createBaseVNode("div", _hoisted_30$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(sensors.value, (s) => {
						return openBlock(), createElementBlock("div", {
							key: s.id,
							class: "sensor-row"
						}, [createBaseVNode("span", null, toDisplayString(s.id), 1), createBaseVNode("b", null, toDisplayString(Number(s.value).toLocaleString("ru-RU", { maximumFractionDigits: 1 })) + " " + toDisplayString(s.unit), 1)]);
					}), 128)), !sensors.value.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("Ядро не предоставляет поддерживаемых датчиков через sysfs.")], 64)) : createCommentVNode("", true)]),
					_cache[14] || (_cache[14] = createBaseVNode("p", { class: "hint" }, "Только датчики, обнаруженные на колонке.", -1))
				])])
			], 64);
		};
	}
});
// src/components/CheckRow.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$14 = ["aria-label"];
var _hoisted_2$13 = { class: "check-copy" };
// src/components/CheckRow.vue
var CheckRow_default = /* @__PURE__ */ defineComponent({
	__name: "CheckRow",
	props: {
		name: {},
		detail: {},
		status: {}
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["check-row", "is-" + __props.status]) }, [createBaseVNode("span", {
				class: "check-mark",
				role: "img",
				"aria-label": __props.status === "ok" ? "Успешно" : __props.status === "error" ? "Ошибка" : "Внимание"
			}, [createVNode(UiIcon_default, { name: __props.status === "ok" ? "check" : __props.status === "error" ? "close" : "info" }, null, 8, ["name"])], 8, _hoisted_1$14), createBaseVNode("div", _hoisted_2$13, [createBaseVNode("b", null, toDisplayString(__props.name), 1), createBaseVNode("span", null, toDisplayString(__props.detail), 1)])], 2);
		};
	}
});
// src/pages/AppsPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$13 = { class: "page-head" };
var _hoisted_2$12 = ["disabled"];
var _hoisted_3$12 = { class: "card" };
var _hoisted_4$11 = { class: "card-head" };
var _hoisted_5$10 = {
	class: "badge",
	id: "apps-boot-badge"
};
var _hoisted_6$10 = {
	class: "hint",
	id: "apps-boot-info"
};
var _hoisted_7$10 = { id: "apps-boot-checks" };
var _hoisted_8$10 = ["disabled"];
var _hoisted_9$10 = { class: "card-head" };
var _hoisted_10$9 = { class: "badge" };
var _hoisted_11$9 = { class: "app-description" };
var _hoisted_12$9 = { class: "app-web" };
var _hoisted_13$8 = ["href"];
var _hoisted_14$6 = {
	key: 1,
	class: "btn",
	disabled: ""
};
var _hoisted_15$5 = { class: "hint" };
var _hoisted_16$5 = { class: "card-head" };
var _hoisted_17$5 = { class: "badge" };
var _hoisted_18$5 = { class: "hint" };
var _hoisted_19$4 = { class: "row" };
var _hoisted_20$3 = [
	"data-app-action",
	"data-service",
	"disabled",
	"onClick"
];
var _hoisted_21$3 = ["data-app-log", "onClick"];
var _hoisted_22$2 = { class: "toggle" };
var _hoisted_23$2 = [
	"data-app-auto",
	"checked",
	"disabled",
	"onChange"
];
var _hoisted_24$1 = {
	key: 0,
	class: "hint"
};
var _hoisted_25$1 = ["onToggle"];
var _hoisted_26$1 = ["data-app-meta", "onSubmit"];
var _hoisted_27$1 = ["onUpdate:modelValue"];
var _hoisted_28$1 = ["onUpdate:modelValue"];
var _hoisted_29$1 = { class: "row" };
var _hoisted_30$1 = ["onUpdate:modelValue"];
var _hoisted_31$1 = ["onUpdate:modelValue"];
var _hoisted_32$1 = ["disabled"];
var _hoisted_33$1 = {
	key: 0,
	class: "card"
};
var _hoisted_34$1 = {
	class: "btn",
	href: "#yam"
};
var _hoisted_35$1 = { class: "card" };
var _hoisted_36$1 = { id: "apps-log-title" };
var _hoisted_37$1 = {
	class: "out",
	id: "apps-log",
	"aria-live": "polite"
};
var _hoisted_38$1 = {
	id: "apps-message",
	class: "hint",
	role: "status"
};
// src/pages/AppsPage.vue
var AppsPage_default = /* @__PURE__ */ defineComponent({
	__name: "AppsPage",
	setup(__props) {
		const api = useApi(), state = /* @__PURE__ */ ref({
			packages: [],
			recovery: {}
		}), logService = /* @__PURE__ */ ref(""), log = /* @__PURE__ */ ref("Выбери «Журнал» у службы."), forms = /* @__PURE__ */ reactive({}), opened = /* @__PURE__ */ new Set(), list = /* @__PURE__ */ ref(), { busy, message, run } = useAction();
		const labels = {
			running: "Процесс запущен",
			stopped: "Остановлена",
			completed: "Завершена",
			failed: "Ошибка",
			waiting: "Ожидание",
			backoff: "Пауза перед повтором"
		};
		const report = computed(() => state.value.recovery || {}), bootBadge = computed(() => state.value.recovery_pending ? "Проверка ожидается" : report.value.checked ? report.value.ok ? "Восстановлено" : "Есть замечания" : "Нет отчёта");
		async function load() {
			if (busy.value) return;
			try {
				const v = await api("/api/apps");
				state.value = v;
				packages.value = v.packages || [];
				for (const p of v.packages || []) if (!opened.has(p.name)) forms[p.name] = {
					description: p.description || "",
					mode: p.web_mode || "auto",
					port: p.web?.port || "",
					path: p.web?.path || "/"
				};
				if (v.error) message.value = v.error;
				if (logService.value && route.active === "apps") await logs(logService.value);
			} catch (e) {
				message.value = e.message;
			}
		}
		async function logs(id) {
			logService.value = id;
			try {
				log.value = (await api("/api/apps/log?service=" + encodeURIComponent(id))).text;
			} catch (e) {
				message.value = e.message;
			}
		}
		function act(data) {
			run(async () => {
				await api("/api/apps/action", data);
				message.value = "Готово";
			}).then(load);
		}
		function save(name) {
			const f = forms[name];
			act({
				action: "metadata",
				package: name,
				description: f.description,
				mode: f.mode,
				port: f.port ? Number(f.port) : null,
				path: f.path || "/"
			});
		}
		function webUrl(web) {
			const url = new URL(location.href);
			url.protocol = "http:";
			url.port = String(web.port);
			url.pathname = web.path;
			url.search = "";
			url.hash = "";
			return url.href;
		}
		function detail(s) {
			return [
				s.detail,
				s.pid ? "PID " + s.pid : "",
				s.exit !== null && s.exit !== void 0 ? "код выхода " + s.exit : "",
				"перезапуск: " + (s.restart || "never"),
				s.oneshot ? "разовая задача" : "",
				s.runtime ? "адаптер экрана" : ""
			].filter(Boolean).join(" · ");
		}
		useEvents(() => {
			if (route.active === "apps" || route.active === "home") load();
		});
		usePolling(load, 5e3, () => ["apps", "home"].includes(route.active) && !opened.size && !list.value?.contains(document.activeElement));
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$13, [createBaseVNode("div", null, [createBaseVNode("h1", null, [createVNode(UiIcon_default, {
					name: "box",
					size: 24
				}), _cache[2] || (_cache[2] = createTextVNode("Приложения", -1))]), _cache[3] || (_cache[3] = createBaseVNode("div", { class: "sub" }, "Запуск служб из пакетов YAM · управление на колонке", -1))]), createBaseVNode("button", {
					class: "btn",
					id: "apps-refresh",
					disabled: unref(busy),
					onClick: _cache[0] || (_cache[0] = ($event) => act({ action: "discover" }))
				}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[4] || (_cache[4] = createTextVNode("Обновить", -1))], 8, _hoisted_2$12)]),
				createBaseVNode("section", _hoisted_3$12, [
					createBaseVNode("div", _hoisted_4$11, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "undo" }), _cache[5] || (_cache[5] = createTextVNode("Восстановление после перезагрузки", -1))]), createBaseVNode("span", _hoisted_5$10, toDisplayString(bootBadge.value), 1)]),
					createBaseVNode("p", _hoisted_6$10, toDisplayString(report.value.checked ? "Последняя проверка: " + unref(stamp)(report.value.checked) : "Проверка начнётся после запуска хоста.") + toDisplayString(state.value.paused ? " Службы приостановлены на время изменения пакетов." : ""), 1),
					createBaseVNode("div", _hoisted_7$10, [(openBlock(true), createElementBlock(Fragment, null, renderList(report.value.checks || [], (c) => {
						return openBlock(), createBlock(CheckRow_default, {
							key: c.name,
							name: c.name,
							detail: c.detail,
							status: c.ok ? "ok" : "error"
						}, null, 8, [
							"name",
							"detail",
							"status"
						]);
					}), 128))]),
					createBaseVNode("button", {
						class: "btn",
						id: "apps-recheck",
						disabled: unref(busy),
						onClick: _cache[1] || (_cache[1] = ($event) => act({ action: "recheck" }))
					}, [createVNode(UiIcon_default, { name: "shield" }), _cache[6] || (_cache[6] = createTextVNode("Проверить сейчас", -1))], 8, _hoisted_8$10),
					_cache[7] || (_cache[7] = createBaseVNode("p", { class: "hint" }, "Проверяются панель, запуск YAM CLI и выбранные службы. Наличие процесса не подтверждает полную работоспособность приложения.", -1))
				]),
				_cache[24] || (_cache[24] = createBaseVNode("p", { class: "hint" }, "Автозапуск выключен, пока ты не включишь его для конкретной службы. До 8 служб одновременно. Приложение должно работать на переднем плане. «Остановить» действует до следующей загрузки; отключение автозапуска не останавливает текущий процесс.", -1)),
				createBaseVNode("div", {
					id: "apps-list",
					ref_key: "list",
					ref: list,
					class: "package-list"
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(state.value.packages, (p) => {
					return openBlock(), createElementBlock("article", {
						key: p.name,
						class: "card app-card"
					}, [
						createBaseVNode("div", _hoisted_9$10, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "box" }), createTextVNode(toDisplayString(p.name), 1)]), createBaseVNode("span", _hoisted_10$9, toDisplayString(p.version), 1)]),
						createBaseVNode("p", _hoisted_11$9, toDisplayString(p.description || ""), 1),
						createBaseVNode("div", _hoisted_12$9, [p.web ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [p.web.ready ? (openBlock(), createElementBlock("a", {
							key: 0,
							class: "btn",
							href: webUrl(p.web),
							target: "_blank",
							rel: "noopener noreferrer"
						}, [createVNode(UiIcon_default, { name: "arrow-right" }), _cache[8] || (_cache[8] = createTextVNode("Открыть интерфейс ↗", -1))], 8, _hoisted_13$8)) : (openBlock(), createElementBlock("button", _hoisted_14$6, [createVNode(UiIcon_default, { name: "arrow-right" }), _cache[9] || (_cache[9] = createTextVNode("Интерфейс недоступен", -1))]))], 64)) : createCommentVNode("", true), createBaseVNode("p", _hoisted_15$5, toDisplayString(p.web_detail || "Веб-интерфейс не обнаружен") + toDisplayString(p.web?.source ? " · " + p.web.source : ""), 1)]),
						(openBlock(true), createElementBlock(Fragment, null, renderList(p.services, (s) => {
							return openBlock(), createElementBlock("div", {
								key: s.id,
								class: "card service-card"
							}, [
								createBaseVNode("div", _hoisted_16$5, [createBaseVNode("b", null, toDisplayString(s.name), 1), createBaseVNode("span", _hoisted_17$5, toDisplayString(labels[s.status] || s.status), 1)]),
								createBaseVNode("p", _hoisted_18$5, toDisplayString(detail(s)), 1),
								createBaseVNode("div", _hoisted_19$4, [(openBlock(), createElementBlock(Fragment, null, renderList([
									[
										"start",
										"play",
										"Запустить"
									],
									[
										"stop",
										"stop",
										"Остановить"
									],
									[
										"restart",
										"refresh",
										"Перезапустить"
									]
								], (a) => {
									return createBaseVNode("button", {
										key: a[0],
										class: "btn sm",
										"data-app-action": a[0],
										"data-service": s.id,
										disabled: unref(busy) || a[0] === "start" && s.status === "running",
										onClick: ($event) => act({
											action: a[0],
											service: s.id
										})
									}, [createVNode(UiIcon_default, { name: a[1] }, null, 8, ["name"]), createTextVNode(toDisplayString(a[2]), 1)], 8, _hoisted_20$3);
								}), 64)), createBaseVNode("button", {
									class: "btn sm",
									"data-app-log": s.id,
									onClick: ($event) => logs(s.id)
								}, [createVNode(UiIcon_default, { name: "log" }), _cache[10] || (_cache[10] = createTextVNode("Журнал", -1))], 8, _hoisted_21$3)]),
								createBaseVNode("label", _hoisted_22$2, [_cache[11] || (_cache[11] = createBaseVNode("span", null, "Автозапуск после загрузки колонки", -1)), createBaseVNode("input", {
									type: "checkbox",
									"data-app-auto": s.id,
									checked: s.autostart,
									disabled: unref(busy),
									onChange: ($event) => act({
										action: $event.target.checked ? "enable" : "disable",
										service: s.id
									})
								}, null, 40, _hoisted_23$2)])
							]);
						}), 128)),
						!p.services.length ? (openBlock(), createElementBlock("p", _hoisted_24$1, "В пакете нет деклараций служб. Запуск вручную возможен через консоль.")) : createCommentVNode("", true),
						createBaseVNode("details", { onToggle: ($event) => $event.target.open ? unref(opened).add(p.name) : unref(opened).delete(p.name) }, [_cache[19] || (_cache[19] = createBaseVNode("summary", null, "Описание и веб-интерфейс", -1)), forms[p.name] ? (openBlock(), createElementBlock("form", {
							key: 0,
							"data-app-meta": p.name,
							onSubmit: withModifiers(($event) => save(p.name), ["prevent"])
						}, [
							createBaseVNode("label", null, [_cache[12] || (_cache[12] = createTextVNode("Описание", -1)), withDirectives(createBaseVNode("input", {
								"onUpdate:modelValue": ($event) => forms[p.name].description = $event,
								class: "field",
								name: "description",
								maxlength: "2000"
							}, null, 8, _hoisted_27$1), [[vModelText, forms[p.name].description]])]),
							createBaseVNode("label", null, [_cache[14] || (_cache[14] = createTextVNode("Ссылка на панель", -1)), withDirectives(createBaseVNode("select", {
								"onUpdate:modelValue": ($event) => forms[p.name].mode = $event,
								class: "field",
								name: "mode"
							}, [..._cache[13] || (_cache[13] = [
								createBaseVNode("option", { value: "auto" }, "Определять автоматически", -1),
								createBaseVNode("option", { value: "manual" }, "Указать вручную", -1),
								createBaseVNode("option", { value: "none" }, "Не показывать", -1)
							])], 8, _hoisted_28$1), [[vModelSelect, forms[p.name].mode]])]),
							createBaseVNode("div", _hoisted_29$1, [
								createBaseVNode("label", null, [_cache[15] || (_cache[15] = createTextVNode("Порт HTTP (для ручного режима)", -1)), withDirectives(createBaseVNode("input", {
									"onUpdate:modelValue": ($event) => forms[p.name].port = $event,
									class: "field",
									name: "port",
									type: "number",
									min: "1024",
									max: "65535",
									placeholder: "Не задан"
								}, null, 8, _hoisted_30$1), [[vModelText, forms[p.name].port]])]),
								createBaseVNode("label", null, [_cache[16] || (_cache[16] = createTextVNode("Путь", -1)), withDirectives(createBaseVNode("input", {
									"onUpdate:modelValue": ($event) => forms[p.name].path = $event,
									class: "field",
									name: "path",
									placeholder: "/"
								}, null, 8, _hoisted_31$1), [[vModelText, forms[p.name].path]])]),
								createBaseVNode("button", {
									class: "btn",
									type: "submit",
									disabled: unref(busy)
								}, [createVNode(UiIcon_default, { name: "check" }), _cache[17] || (_cache[17] = createTextVNode("Сохранить", -1))], 8, _hoisted_32$1)
							]),
							_cache[18] || (_cache[18] = createBaseVNode("p", { class: "hint" }, "Автопоиск проверяет HTTP-панель на портах процесса приложения. Ссылка активна после ответа. Свой порт и путь применяются только в ручном режиме; порты в роутере не открываются.", -1))
						], 40, _hoisted_26$1)) : createCommentVNode("", true)], 40, _hoisted_25$1)
					]);
				}), 128)), !state.value.packages?.length ? (openBlock(), createElementBlock("section", _hoisted_33$1, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "box" }), _cache[20] || (_cache[20] = createTextVNode("Пакетов пока нет", -1))]),
					_cache[22] || (_cache[22] = createBaseVNode("p", { class: "hint" }, "Установи приложение с декларацией службы через YAM v2.", -1)),
					createBaseVNode("a", _hoisted_34$1, [createVNode(UiIcon_default, { name: "layers" }), _cache[21] || (_cache[21] = createTextVNode("Открыть YAM", -1))])
				])) : createCommentVNode("", true)], 512),
				createBaseVNode("section", _hoisted_35$1, [
					createBaseVNode("h2", _hoisted_36$1, [createVNode(UiIcon_default, { name: "log" }), createTextVNode(toDisplayString(logService.value ? "Журнал: " + logService.value : "Журнал службы"), 1)]),
					createBaseVNode("pre", _hoisted_37$1, toDisplayString(log.value), 1),
					_cache[23] || (_cache[23] = createBaseVNode("p", { class: "hint" }, "До 256 КБ в файле и одна предыдущая копия на службу. На экран выводятся последние 32 КБ.", -1))
				]),
				createBaseVNode("p", _hoisted_38$1, toDisplayString(unref(message)), 1)
			], 64);
		};
	}
});
// src/pages/YamPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$12 = { class: "page-head" };
var _hoisted_2$11 = ["disabled"];
var _hoisted_3$11 = { class: "card" };
var _hoisted_4$10 = { class: "card-head" };
var _hoisted_5$9 = {
	class: "badge",
	id: "y2-version"
};
var _hoisted_6$9 = {
	class: "hint",
	id: "y2-state",
	role: "status"
};
var _hoisted_7$9 = { class: "row" };
var _hoisted_8$9 = ["disabled"];
var _hoisted_9$9 = ["disabled"];
var _hoisted_10$8 = {
	class: "btn",
	href: "https://github.com/nyakokitsu/yam/releases",
	target: "_blank",
	rel: "noopener"
};
var _hoisted_11$8 = ["hidden"];
var _hoisted_12$8 = ["disabled"];
var _hoisted_13$7 = ["hidden"];
var _hoisted_14$5 = { class: "card" };
var _hoisted_15$4 = { class: "card-head" };
var _hoisted_16$4 = {
	class: "badge",
	id: "y2-count"
};
var _hoisted_17$4 = { class: "btn upload-label" };
var _hoisted_18$4 = ["disabled"];
var _hoisted_19$3 = { class: "toggle" };
var _hoisted_20$2 = ["disabled"];
var _hoisted_21$2 = {
	id: "y2-packages",
	class: "package-list"
};
var _hoisted_22$1 = { class: "row" };
var _hoisted_23$1 = [
	"data-y2-files",
	"disabled",
	"onClick"
];
var _hoisted_24 = [
	"data-y2-remove",
	"disabled",
	"onClick"
];
var _hoisted_25 = {
	key: 0,
	class: "hint"
};
var _hoisted_26 = { class: "card" };
var _hoisted_27 = { class: "catalog-search" };
var _hoisted_28 = ["disabled"];
var _hoisted_29 = ["value"];
var _hoisted_30 = ["disabled"];
var _hoisted_31 = ["disabled"];
var _hoisted_32 = {
	id: "y2-results",
	class: "package-list"
};
var _hoisted_33 = { class: "catalog-head" };
var _hoisted_34 = {
	class: "catalog-symbol",
	"aria-hidden": "true"
};
var _hoisted_35 = { class: "catalog-title" };
var _hoisted_36 = { class: "badge" };
var _hoisted_37 = { class: "catalog-summary" };
var _hoisted_38 = { class: "catalog-actions" };
var _hoisted_39 = [
	"data-y2-pick",
	"disabled",
	"onClick"
];
var _hoisted_40 = [
	"data-y2-info",
	"disabled",
	"onClick"
];
var _hoisted_41 = {
	key: 0,
	class: "hint"
};
var _hoisted_42 = { class: "catalog-install" };
var _hoisted_43 = ["disabled"];
var _hoisted_44 = ["disabled"];
var _hoisted_45 = ["disabled"];
var _hoisted_46 = { class: "card" };
var _hoisted_47 = { id: "y2-registries" };
var _hoisted_48 = [
	"data-y2-reg-remove",
	"disabled",
	"onClick"
];
var _hoisted_49 = {
	key: 0,
	class: "hint"
};
var _hoisted_50 = ["disabled"];
var _hoisted_51 = { class: "row" };
var _hoisted_52 = ["disabled"];
var _hoisted_53 = ["disabled"];
var _hoisted_54 = ["disabled"];
var _hoisted_55 = ["disabled"];
var _hoisted_56 = { class: "card" };
var _hoisted_57 = { class: "row" };
var _hoisted_58 = ["disabled"];
var _hoisted_59 = ["disabled"];
var _hoisted_60 = ["disabled"];
var _hoisted_61 = ["disabled"];
var _hoisted_62 = { class: "row" };
var _hoisted_63 = ["disabled"];
var _hoisted_64 = ["disabled"];
var _hoisted_65 = { class: "card" };
var _hoisted_66 = {
	class: "out",
	id: "y2-report",
	"aria-live": "polite"
};
// src/pages/YamPage.vue
var YamPage_default = /* @__PURE__ */ defineComponent({
	__name: "YamPage",
	setup(__props) {
		const confirm = window.confirm.bind(window), api = useApi(), installed = /* @__PURE__ */ ref(false), transition = /* @__PURE__ */ ref({}), local = /* @__PURE__ */ ref([]), registries = /* @__PURE__ */ ref([]), results = /* @__PURE__ */ ref([]), searched = /* @__PURE__ */ ref(false), registry = /* @__PURE__ */ ref("official"), query = /* @__PURE__ */ ref(""), name = /* @__PURE__ */ ref(""), replace = /* @__PURE__ */ ref(false), regName = /* @__PURE__ */ ref(""), regUrl = /* @__PURE__ */ ref(""), regKey = /* @__PURE__ */ ref(""), path = /* @__PURE__ */ ref(""), fileInput = /* @__PURE__ */ ref(), state = /* @__PURE__ */ ref("Получаем состояние YAM…"), { busy, message: report, run } = useAction(/* @__PURE__ */ ref("Выбери действие."));
		const call = (path, body, options = {}) => api("/api/yam2/" + path, body, {
			timeout: 3e5,
			...options
		});
		const action = (action, extra = {}) => call("action", {
			action,
			registry: registry.value || "official",
			...extra
		});
		async function refresh() {
			const v = await call("status");
			installed.value = v.installed;
			yamVersion.value = v.installed ? "Установлен " + (v.version || "(версия не определена)") : "Ещё не установлен";
			state.value = v.installed ? "Готов к установке и обновлению приложений." : "Установи актуальную ARM64-версию YAM. После установки заверши переход на новый менеджер.";
			transition.value = await call("retirement");
			if (!transition.value.pending && transition.value.archive) state.value += " Архив прежнего менеджера: " + transition.value.archive;
			if (!v.installed) return;
			const [p, r] = await Promise.allSettled([call("packages"), call("registries")]);
			if (p.status === "fulfilled") local.value = p.value;
			else report.value = p.reason.message;
			if (r.status === "fulfilled") {
				registries.value = r.value;
				if (!r.value.some((x) => x.name === registry.value)) registry.value = r.value[0]?.name || "official";
			} else report.value = r.reason.message;
		}
		function operate(fn) {
			run(async () => {
				const v = await fn();
				if (v !== void 0) report.value = typeof v === "string" ? v : v.report || JSON.stringify(v, null, 2);
				await refresh();
			});
		}
		function bootstrap() {
			if (confirm(installed.value ? "Обновить YAM его штатным механизмом с проверкой подписи? Бинарник и база будут сохранены перед операцией." : "Установить актуальный YAM ARM64 в /data/yam? Скачивание около 4 МБ; старые yamd и .yap сохранятся.")) operate(() => call("bootstrap", {}));
		}
		function retire() {
			if (confirm("Остановить прежние приложения .yap, убрать yamd и его автозапуск? Весь каталог и загрузочный скрипт будут сохранены в архиве.")) operate(() => call("retire", {}));
		}
		function search() {
			operate(async () => {
				const v = await action("search", { query: query.value });
				results.value = v.items;
				searched.value = true;
				return "Найдено: " + v.items.length;
			});
		}
		function pick(p) {
			name.value = p;
			report.value = "Пакет выбран. Проверь зависимости перед установкой.";
		}
		function install() {
			if (confirm("Установить " + name.value.trim() + " и его зависимости? Проверь план установки.")) operate(() => action("install", {
				name: name.value.trim(),
				allow_replacements: replace.value
			}));
		}
		function remove(p) {
			if (confirm("Удалить пакет " + p + "?")) operate(() => action("remove", { name: p }));
		}
		function removeRegistry(r) {
			if (confirm("Удалить реестр " + r + "? Установленные пакеты сохранятся.")) operate(() => action("registry-remove", { registry: r }));
		}
		function upload() {
			const file = fileInput.value?.files?.[0];
			if (!file) return;
			if (!file.name.endsWith(".yampkg") || file.size > 33554432) {
				report.value = "Нужен файл .yampkg до 32 МБ.";
				fileInput.value.value = "";
				return;
			}
			if (!confirm("Установить локальный пакет " + file.name + "? Его код и postinstall получат права root.")) {
				fileInput.value.value = "";
				return;
			}
			operate(async () => {
				try {
					return await call("upload", file, {
						raw: true,
						headers: replace.value ? { "X-Yam-Allow-Replacements": "true" } : {}
					});
				} finally {
					fileInput.value.value = "";
				}
			});
		}
		async function load() {
			if (busy.value) return;
			try {
				await refresh();
			} catch (e) {
				state.value = e.message;
			}
		}
		load();
		useEvents(() => {
			if (["yam", "home"].includes(route.active)) load();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$12, [createBaseVNode("div", null, [createBaseVNode("h1", null, [createVNode(UiIcon_default, {
					name: "layers",
					size: 24
				}), _cache[18] || (_cache[18] = createTextVNode("YAM v2", -1))]), _cache[19] || (_cache[19] = createBaseVNode("div", { class: "sub" }, "Пакеты .yampkg · Мини 3 Про / pickle · управление на колонке", -1))]), createBaseVNode("button", {
					class: "btn",
					id: "y2-refresh",
					disabled: unref(busy),
					onClick: _cache[0] || (_cache[0] = ($event) => {
						operate(async () => {
							await refresh();
							return "Данные обновлены.";
						});
					})
				}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[20] || (_cache[20] = createTextVNode("Обновить данные", -1))], 8, _hoisted_2$11)]),
				createBaseVNode("section", _hoisted_3$11, [
					createBaseVNode("div", _hoisted_4$10, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "box" }), _cache[21] || (_cache[21] = createTextVNode("Менеджер пакетов", -1))]), createBaseVNode("span", _hoisted_5$9, toDisplayString(unref(yamVersion)), 1)]),
					createBaseVNode("p", _hoisted_6$9, toDisplayString(state.value), 1),
					createBaseVNode("div", _hoisted_7$9, [
						createBaseVNode("button", {
							class: "btn primary",
							id: "y2-bootstrap",
							disabled: unref(busy),
							onClick: bootstrap
						}, [createVNode(UiIcon_default, { name: "dl" }), createTextVNode(toDisplayString(installed.value ? "Обновить YAM" : "Установить актуальный YAM"), 1)], 8, _hoisted_8$9),
						createBaseVNode("button", {
							class: "btn",
							id: "y2-latest",
							disabled: unref(busy),
							onClick: _cache[1] || (_cache[1] = ($event) => {
								operate(async () => {
									const v = await call("latest");
									return "Последняя стабильная версия: " + v.version + "\n" + v.url;
								});
							})
						}, [createVNode(UiIcon_default, { name: "search" }), _cache[22] || (_cache[22] = createTextVNode("Проверить версию", -1))], 8, _hoisted_9$9),
						createBaseVNode("a", _hoisted_10$8, [createVNode(UiIcon_default, { name: "arrow-right" }), _cache[23] || (_cache[23] = createTextVNode("Релизы ↗", -1))])
					]),
					_cache[24] || (_cache[24] = createBaseVNode("details", { class: "manager-details" }, [createBaseVNode("summary", null, "Сведения о менеджере"), createBaseVNode("p", { class: "hint" }, "YAM v2 установлен в /data/yam и работает локально через CLI. Пакеты прежнего формата .yap не преобразуются в .yampkg.")], -1))
				]),
				createBaseVNode("section", {
					class: "card",
					id: "y2-transition",
					hidden: !transition.value.pending
				}, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[25] || (_cache[25] = createTextVNode("Завершить переход", -1))]),
					_cache[27] || (_cache[27] = createBaseVNode("p", {
						class: "hint",
						id: "y2-transition-note"
					}, "Установи YAM v2, затем заверши переход: старые приложения .yap остановятся, yamd и его автозапуск будут отключены, каталог с данными переместится в архив. Файлы не удаляются.", -1)),
					createBaseVNode("button", {
						class: "btn",
						id: "y2-retire",
						disabled: unref(busy) || !installed.value,
						onClick: retire
					}, [createVNode(UiIcon_default, { name: "archive" }), _cache[26] || (_cache[26] = createTextVNode("Завершить переход и убрать yamd", -1))], 8, _hoisted_12$8)
				], 8, _hoisted_11$8),
				createBaseVNode("div", {
					id: "y2-controls",
					hidden: !installed.value
				}, [
					createBaseVNode("section", _hoisted_14$5, [
						createBaseVNode("div", _hoisted_15$4, [createBaseVNode("h2", null, [
							createVNode(UiIcon_default, { name: "box" }),
							_cache[28] || (_cache[28] = createTextVNode("Установленные пакеты ", -1)),
							createBaseVNode("span", _hoisted_16$4, toDisplayString(local.value.length), 1)
						]), createBaseVNode("label", _hoisted_17$4, [
							createVNode(UiIcon_default, { name: "dl" }),
							_cache[29] || (_cache[29] = createTextVNode("Загрузить .yampkg", -1)),
							createBaseVNode("input", {
								type: "file",
								id: "y2-file",
								ref_key: "fileInput",
								ref: fileInput,
								accept: ".yampkg",
								hidden: "",
								disabled: unref(busy),
								onChange: upload
							}, null, 40, _hoisted_18$4)
						])]),
						_cache[33] || (_cache[33] = createBaseVNode("p", { class: "hint" }, "Пакеты до 32 МБ. Устанавливай их из доверенных источников: они могут выполнять системные команды.", -1)),
						createBaseVNode("label", _hoisted_19$3, [_cache[30] || (_cache[30] = createBaseVNode("span", null, "Разрешить замену конфликтов и зависимости Entware", -1)), withDirectives(createBaseVNode("input", {
							type: "checkbox",
							id: "y2-replace",
							"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => replace.value = $event),
							disabled: unref(busy)
						}, null, 8, _hoisted_20$2), [[vModelCheckbox, replace.value]])]),
						createBaseVNode("div", _hoisted_21$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(local.value, (p) => {
							return openBlock(), createElementBlock("article", {
								key: p.name,
								class: "card package-item"
							}, [createBaseVNode("div", null, [createBaseVNode("h3", null, [createVNode(UiIcon_default, { name: "box" }), createTextVNode(toDisplayString(p.name), 1)]), createBaseVNode("p", null, toDisplayString(p.version) + " · " + toDisplayString(p.target), 1)]), createBaseVNode("div", _hoisted_22$1, [createBaseVNode("button", {
								class: "btn sm",
								"data-y2-files": p.name,
								disabled: unref(busy),
								onClick: ($event) => operate(() => action("files", { name: p.name }))
							}, [createVNode(UiIcon_default, { name: "folder" }), _cache[31] || (_cache[31] = createTextVNode("Файлы", -1))], 8, _hoisted_23$1), createBaseVNode("button", {
								class: "btn sm danger",
								"data-y2-remove": p.name,
								disabled: unref(busy),
								onClick: ($event) => remove(p.name)
							}, [createVNode(UiIcon_default, { name: "trash" }), _cache[32] || (_cache[32] = createTextVNode("Удалить", -1))], 8, _hoisted_24)])]);
						}), 128)), !local.value.length ? (openBlock(), createElementBlock("p", _hoisted_25, "Пакетов .yampkg пока нет.")) : createCommentVNode("", true)])
					]),
					createBaseVNode("section", _hoisted_26, [
						createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "layers" }), _cache[34] || (_cache[34] = createTextVNode("Каталог и зависимости", -1))]),
						createBaseVNode("div", _hoisted_27, [
							withDirectives(createBaseVNode("select", {
								class: "field",
								id: "y2-registry",
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => registry.value = $event),
								disabled: unref(busy),
								"aria-label": "Реестр"
							}, [(openBlock(true), createElementBlock(Fragment, null, renderList(registries.value, (r) => {
								return openBlock(), createElementBlock("option", {
									key: r.name,
									value: r.name
								}, toDisplayString(r.name), 9, _hoisted_29);
							}), 128))], 8, _hoisted_28), [[vModelSelect, registry.value]]),
							withDirectives(createBaseVNode("input", {
								class: "field",
								id: "y2-query",
								"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => query.value = $event),
								disabled: unref(busy),
								type: "search",
								placeholder: "Название или описание",
								"aria-label": "Поиск YAM",
								onKeydown: withKeys(search, ["enter"])
							}, null, 40, _hoisted_30), [[vModelText, query.value]]),
							createBaseVNode("button", {
								class: "btn",
								id: "y2-search",
								disabled: unref(busy),
								onClick: search
							}, [createVNode(UiIcon_default, { name: "search" }), _cache[35] || (_cache[35] = createTextVNode("Найти", -1))], 8, _hoisted_31)
						]),
						createBaseVNode("div", _hoisted_32, [(openBlock(true), createElementBlock(Fragment, null, renderList(results.value, (p) => {
							return openBlock(), createElementBlock("article", {
								key: p.name,
								class: "card catalog-card"
							}, [
								createBaseVNode("div", _hoisted_33, [createBaseVNode("span", _hoisted_34, [createVNode(UiIcon_default, {
									name: "box",
									size: 20
								})]), createBaseVNode("div", _hoisted_35, [createBaseVNode("h3", null, toDisplayString(p.name), 1), createBaseVNode("span", _hoisted_36, toDisplayString(p.version), 1)])]),
								createBaseVNode("p", _hoisted_37, toDisplayString(p.summary || "Описание отсутствует."), 1),
								createBaseVNode("div", _hoisted_38, [createBaseVNode("button", {
									class: "btn sm",
									"data-y2-pick": p.name,
									disabled: unref(busy),
									onClick: ($event) => pick(p.name)
								}, [createVNode(UiIcon_default, { name: "plus" }), _cache[36] || (_cache[36] = createTextVNode("Выбрать", -1))], 8, _hoisted_39), createBaseVNode("button", {
									class: "btn sm",
									"data-y2-info": p.name,
									disabled: unref(busy),
									onClick: ($event) => operate(() => action("info", { name: p.name }))
								}, [createVNode(UiIcon_default, { name: "info" }), _cache[37] || (_cache[37] = createTextVNode("Описание", -1))], 8, _hoisted_40)])
							]);
						}), 128)), searched.value && !results.value.length ? (openBlock(), createElementBlock("p", _hoisted_41, "По этому запросу пакетов нет.")) : createCommentVNode("", true)]),
						createBaseVNode("div", _hoisted_42, [
							withDirectives(createBaseVNode("input", {
								class: "field",
								id: "y2-name",
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => name.value = $event),
								disabled: unref(busy),
								placeholder: "namespace/name[@версия]",
								"aria-label": "Имя пакета"
							}, null, 8, _hoisted_43), [[vModelText, name.value]]),
							createBaseVNode("button", {
								class: "btn",
								id: "y2-plan",
								disabled: unref(busy),
								onClick: _cache[6] || (_cache[6] = ($event) => operate(() => action("plan", { name: name.value.trim() })))
							}, [createVNode(UiIcon_default, { name: "layers" }), _cache[38] || (_cache[38] = createTextVNode("Показать зависимости", -1))], 8, _hoisted_44),
							createBaseVNode("button", {
								class: "btn primary",
								id: "y2-install",
								disabled: unref(busy),
								onClick: install
							}, [createVNode(UiIcon_default, { name: "dl" }), _cache[39] || (_cache[39] = createTextVNode("Установить", -1))], 8, _hoisted_45)
						]),
						_cache[40] || (_cache[40] = createBaseVNode("p", { class: "hint" }, "Каталог и индексы проверяются ключом Ed25519, скачанные пакеты — по размеру и SHA-256. Сначала проверь план установки: он не изменяет пакеты.", -1))
					]),
					createBaseVNode("section", _hoisted_46, [
						createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "layers" }), _cache[41] || (_cache[41] = createTextVNode("Реестры", -1))]),
						createBaseVNode("div", _hoisted_47, [(openBlock(true), createElementBlock(Fragment, null, renderList(registries.value, (r) => {
							return openBlock(), createElementBlock("div", {
								key: r.name,
								class: "summary-row"
							}, [createBaseVNode("span", null, [createBaseVNode("b", null, toDisplayString(r.name), 1), createTextVNode(" · " + toDisplayString(r.url), 1)]), createBaseVNode("button", {
								class: "btn sm danger",
								"data-y2-reg-remove": r.name,
								disabled: unref(busy),
								onClick: ($event) => removeRegistry(r.name)
							}, [createVNode(UiIcon_default, { name: "trash" }), _cache[42] || (_cache[42] = createTextVNode("Удалить", -1))], 8, _hoisted_48)]);
						}), 128)), !registries.value.length ? (openBlock(), createElementBlock("p", _hoisted_49, "Реестр ещё не подключён. Добавь официальный реестр для поиска и установки по имени.")) : createCommentVNode("", true)]),
						createBaseVNode("button", {
							class: "btn",
							id: "y2-official",
							disabled: unref(busy),
							onClick: _cache[7] || (_cache[7] = ($event) => operate(() => action("official-registry")))
						}, [createVNode(UiIcon_default, { name: "plus" }), _cache[43] || (_cache[43] = createTextVNode("Подключить официальный реестр", -1))], 8, _hoisted_50),
						createBaseVNode("details", null, [_cache[45] || (_cache[45] = createBaseVNode("summary", null, "Добавить другой реестр", -1)), createBaseVNode("div", _hoisted_51, [
							withDirectives(createBaseVNode("input", {
								class: "field",
								id: "y2-reg-name",
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => regName.value = $event),
								disabled: unref(busy),
								placeholder: "Имя"
							}, null, 8, _hoisted_52), [[vModelText, regName.value]]),
							withDirectives(createBaseVNode("input", {
								class: "field",
								id: "y2-reg-url",
								"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => regUrl.value = $event),
								disabled: unref(busy),
								type: "url",
								placeholder: "https://repo.example/v2"
							}, null, 8, _hoisted_53), [[vModelText, regUrl.value]]),
							withDirectives(createBaseVNode("input", {
								class: "field",
								id: "y2-reg-key",
								"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => regKey.value = $event),
								disabled: unref(busy),
								placeholder: "ed25519:публичный-ключ-Base64"
							}, null, 8, _hoisted_54), [[vModelText, regKey.value]]),
							createBaseVNode("button", {
								class: "btn",
								id: "y2-reg-add",
								disabled: unref(busy),
								onClick: _cache[11] || (_cache[11] = ($event) => operate(() => action("registry-add", {
									registry: regName.value.trim(),
									url: regUrl.value.trim(),
									key: regKey.value.trim()
								})))
							}, [createVNode(UiIcon_default, { name: "plus" }), _cache[44] || (_cache[44] = createTextVNode("Добавить", -1))], 8, _hoisted_55)
						])])
					]),
					createBaseVNode("section", _hoisted_56, [
						createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "shield" }), _cache[46] || (_cache[46] = createTextVNode("Диагностика и службы", -1))]),
						createBaseVNode("div", _hoisted_57, [
							createBaseVNode("button", {
								class: "btn",
								id: "y2-doctor",
								disabled: unref(busy),
								onClick: _cache[12] || (_cache[12] = ($event) => operate(() => action("doctor")))
							}, [createVNode(UiIcon_default, { name: "shield" }), _cache[47] || (_cache[47] = createTextVNode("Проверить пакеты (doctor)", -1))], 8, _hoisted_58),
							createBaseVNode("button", {
								class: "btn",
								id: "y2-repair",
								disabled: unref(busy),
								onClick: _cache[13] || (_cache[13] = ($event) => unref(confirm)("Восстановить ссылки пакетов по базе YAM?") && operate(() => action("repair")))
							}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[48] || (_cache[48] = createTextVNode("Восстановить ссылки (repair)", -1))], 8, _hoisted_59),
							createBaseVNode("button", {
								class: "btn",
								id: "y2-entware",
								disabled: unref(busy),
								onClick: _cache[14] || (_cache[14] = ($event) => operate(() => action("entware")))
							}, [createVNode(UiIcon_default, { name: "server" }), _cache[49] || (_cache[49] = createTextVNode("Проверить Entware", -1))], 8, _hoisted_60),
							createBaseVNode("button", {
								class: "btn",
								id: "y2-services",
								disabled: unref(busy),
								onClick: _cache[15] || (_cache[15] = ($event) => operate(() => call("services")))
							}, [createVNode(UiIcon_default, { name: "layers" }), _cache[50] || (_cache[50] = createTextVNode("Декларации служб", -1))], 8, _hoisted_61)
						]),
						_cache[52] || (_cache[52] = createBaseVNode("p", { class: "hint" }, "Службы запускает хост панели в разделе «Приложения». YAM управляет установкой пакетов; правила запуска и автозапуска сохраняются отдельно.", -1)),
						createBaseVNode("div", _hoisted_62, [withDirectives(createBaseVNode("input", {
							class: "field",
							id: "y2-path",
							"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => path.value = $event),
							disabled: unref(busy),
							placeholder: "bin/команда",
							"aria-label": "Относительный путь"
						}, null, 8, _hoisted_63), [[vModelText, path.value]]), createBaseVNode("button", {
							class: "btn",
							id: "y2-which",
							disabled: unref(busy),
							onClick: _cache[17] || (_cache[17] = ($event) => operate(() => action("which", { path: path.value.trim() })))
						}, [createVNode(UiIcon_default, { name: "search" }), _cache[51] || (_cache[51] = createTextVNode("Найти владельца файла", -1))], 8, _hoisted_64)])
					])
				], 8, _hoisted_13$7),
				createBaseVNode("section", _hoisted_65, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[53] || (_cache[53] = createTextVNode("Результат операции", -1))]), createBaseVNode("pre", _hoisted_66, toDisplayString(unref(report)), 1)])
			], 64);
		};
	}
});
// src/pages/UpdatesPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$11 = { class: "page-head" };
var _hoisted_2$10 = {
	class: "card",
	id: "native-updates"
};
var _hoisted_3$10 = { class: "card-head" };
var _hoisted_4$9 = { class: "set-item" };
var _hoisted_5$8 = { class: "set-ctl" };
var _hoisted_6$8 = { class: "toggle" };
var _hoisted_7$8 = { class: "row" };
var _hoisted_8$8 = ["disabled"];
var _hoisted_9$8 = ["disabled"];
var _hoisted_10$7 = ["disabled", "hidden"];
var _hoisted_11$7 = {
	class: "hint",
	id: "native-update-status"
};
var _hoisted_12$7 = {
	class: "out",
	id: "native-notes"
};
var _hoisted_13$6 = {
	class: "hint",
	id: "native-checked"
};
var _hoisted_14$4 = { class: "toggle" };
var _hoisted_15$3 = {
	class: "hint",
	id: "native-space"
};
var _hoisted_16$3 = {
	class: "hint",
	id: "native-cleanup-status"
};
var _hoisted_17$3 = ["disabled"];
var _hoisted_18$3 = ["disabled"];
var _hoisted_19$2 = { class: "card" };
// src/pages/UpdatesPage.vue
var UpdatesPage_default = /* @__PURE__ */ defineComponent({
	__name: "UpdatesPage",
	setup(__props) {
		const api = useApi(), info = /* @__PURE__ */ ref({ status: {} }), feed = /* @__PURE__ */ ref(""), auto = /* @__PURE__ */ ref(false), autoCleanup = /* @__PURE__ */ ref(true), { busy, message, run } = useAction();
		const statusText = computed(() => message.value || info.value.status?.error || (info.value.status?.pending ? "Ожидаем запуск " + info.value.status.pending : info.value.status?.available ? "Доступна " + info.value.status.latest : "Установлена " + (info.value.installed || "…")) + (info.value.feed ? "" : " · источник обновлений не настроен"));
		const checkedText = computed(() => "Последняя проверка: " + stamp(info.value.status?.checked) + "\nПредыдущая сборка: " + (info.value.previous || "нет"));
		const spaceText = computed(() => info.value.free === void 0 ? "" : "Свободно: " + (info.value.free / 1048576).toFixed(1) + " МБ · для обновления: " + Math.ceil(info.value.required_free / 1048576) + " МБ");
		const cleanupText = computed(() => {
			const c = info.value.cleanup || {};
			return c.checked ? "Последняя очистка: " + stamp(c.checked) + " · " + (c.skipped || "удалено объектов: " + (c.removed || []).length + ", освобождено: " + ((c.freed || 0) / 1048576).toFixed(1) + " МБ") + ((c.errors || []).length ? " · Есть ошибки: " + c.errors.join("; ") : "") : "Автоочистка ещё не выполнялась.";
		});
		let baseline = "";
		async function load(force = false) {
			try {
				info.value = await api("/api/native/updates");
				if (force || !baseline || JSON.stringify([
					feed.value,
					auto.value,
					autoCleanup.value
				]) === baseline) {
					feed.value = info.value.feed || "";
					auto.value = info.value.auto;
					autoCleanup.value = info.value.auto_cleanup !== false;
					baseline = JSON.stringify([
						feed.value,
						auto.value,
						autoCleanup.value
					]);
				}
			} catch (e) {
				message.value = e.message;
			}
		}
		function operate(action) {
			run(async () => {
				await api("/api/native/updates/" + action, {});
				message.value = "";
				await load();
			});
		}
		function save() {
			run(async () => {
				await api("/api/native/updates/config", {
					feed: feed.value.trim(),
					auto: auto.value,
					auto_cleanup: autoCleanup.value
				});
				message.value = "";
				await load(true);
			});
		}
		function install(action) {
			if (!confirm((action === "apply" ? "Установить обновление" : "Вернуться к предыдущей версии") + "? Панель перезапустится. Настройки сохранятся.")) return;
			run(async () => {
				await api("/api/native/updates/" + action, {});
				message.value = "Перезапуск…";
				setTimeout(() => location.reload(), 2e4);
			});
		}
		load();
		useEvents(() => {
			if (["updates", "settings"].includes(route.active)) load();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$11, [createBaseVNode("h1", null, [createVNode(UiIcon_default, { name: "refresh" }), _cache[7] || (_cache[7] = createTextVNode("Обновления панели", -1))])]),
				createBaseVNode("section", _hoisted_2$10, [
					createBaseVNode("div", _hoisted_3$10, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "refresh" }), _cache[8] || (_cache[8] = createTextVNode("Обновления панели", -1))]), _cache[9] || (_cache[9] = createBaseVNode("span", { class: "badge ok" }, "На колонке", -1))]),
					_cache[18] || (_cache[18] = createBaseVNode("p", { class: "hint" }, "ПК не нужен. Обновляется только панель; runtime, данные, YAM и прошивка не заменяются.", -1)),
					createBaseVNode("label", _hoisted_4$9, [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Источник обновлений"), createBaseVNode("small", null, "HTTPS-манифест из своего репозитория GitHub")], -1)), createBaseVNode("div", _hoisted_5$8, [withDirectives(createBaseVNode("input", {
						class: "field",
						id: "native-feed",
						type: "url",
						placeholder: "https://raw.githubusercontent.com/…/update.json",
						"aria-label": "Источник обновлений",
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => feed.value = $event)
					}, null, 512), [[vModelText, feed.value]])])]),
					createBaseVNode("label", _hoisted_6$8, [_cache[11] || (_cache[11] = createBaseVNode("span", null, "Автоматически проверять и устанавливать обновления", -1)), withDirectives(createBaseVNode("input", {
						type: "checkbox",
						id: "native-auto",
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => auto.value = $event)
					}, null, 512), [[vModelCheckbox, auto.value]])]),
					createBaseVNode("div", _hoisted_7$8, [
						createBaseVNode("button", {
							class: "btn",
							id: "native-save",
							onClick: save,
							disabled: unref(busy)
						}, [createVNode(UiIcon_default, { name: "check" }), _cache[12] || (_cache[12] = createTextVNode("Сохранить", -1))], 8, _hoisted_8$8),
						createBaseVNode("button", {
							class: "btn",
							id: "native-check",
							onClick: _cache[2] || (_cache[2] = ($event) => operate("check")),
							disabled: unref(busy) || !feed.value
						}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[13] || (_cache[13] = createTextVNode("Проверить", -1))], 8, _hoisted_9$8),
						createBaseVNode("button", {
							class: "btn primary",
							id: "native-apply",
							onClick: _cache[3] || (_cache[3] = ($event) => install("apply")),
							disabled: unref(busy),
							hidden: !info.value.status?.available
						}, [createVNode(UiIcon_default, { name: "dl" }), _cache[14] || (_cache[14] = createTextVNode("Установить обновление", -1))], 8, _hoisted_10$7)
					]),
					createBaseVNode("p", _hoisted_11$7, toDisplayString(statusText.value), 1),
					createBaseVNode("pre", _hoisted_12$7, toDisplayString(info.value.status?.notes || "Описание изменений отсутствует."), 1),
					createBaseVNode("p", _hoisted_13$6, toDisplayString(checkedText.value), 1),
					createBaseVNode("label", _hoisted_14$4, [_cache[15] || (_cache[15] = createBaseVNode("span", null, "Автоматически очищать неиспользуемые сборки панели", -1)), withDirectives(createBaseVNode("input", {
						type: "checkbox",
						id: "native-cleanup-auto",
						checked: "",
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => autoCleanup.value = $event)
					}, null, 512), [[vModelCheckbox, autoCleanup.value]])]),
					_cache[19] || (_cache[19] = createBaseVNode("p", { class: "hint" }, "Очистка каждый час и перед проверкой/установкой обновления. Сохраняются текущая и предыдущая сборки, данные приложений и резервные копии.", -1)),
					createBaseVNode("p", _hoisted_15$3, toDisplayString(spaceText.value), 1),
					createBaseVNode("p", _hoisted_16$3, toDisplayString(cleanupText.value), 1),
					createBaseVNode("button", {
						class: "btn",
						id: "native-cleanup",
						onClick: _cache[5] || (_cache[5] = ($event) => operate("cleanup")),
						disabled: unref(busy)
					}, [createVNode(UiIcon_default, { name: "trash" }), _cache[16] || (_cache[16] = createTextVNode("Очистить сейчас", -1))], 8, _hoisted_17$3),
					createBaseVNode("button", {
						class: "btn danger",
						id: "native-rollback",
						onClick: _cache[6] || (_cache[6] = ($event) => install("rollback")),
						disabled: unref(busy) || !info.value.previous || !!info.value.status?.pending
					}, [createVNode(UiIcon_default, { name: "undo" }), _cache[17] || (_cache[17] = createTextVNode("Вернуться к предыдущей версии", -1))], 8, _hoisted_18$3)
				]),
				createBaseVNode("section", _hoisted_19$2, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[20] || (_cache[20] = createTextVNode("Источник обновлений", -1))]), _cache[21] || (_cache[21] = createBaseVNode("p", { class: "hint" }, "Укажи HTTPS-адрес update.json своего репозитория GitHub. Пока релиз не опубликован, проверка через интернет недоступна. Автообновление скачивает и устанавливает новую сборку каждые 6 часов; при неудачном запуске служба возвращает предыдущую.", -1))])
			], 64);
		};
	}
});
// src/components/OnDeviceAssistant.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$10 = { class: "card" };
var _hoisted_2$9 = { class: "card-head" };
var _hoisted_3$9 = { class: "badge" };
var _hoisted_4$8 = {
	key: 0,
	role: "status",
	class: "hint"
};
var _hoisted_5$7 = ["placeholder"];
var _hoisted_6$7 = { class: "toggle" };
var _hoisted_7$7 = { class: "row" };
var _hoisted_8$7 = ["disabled"];
var _hoisted_9$7 = ["disabled"];
var _hoisted_10$6 = ["disabled"];
var _hoisted_11$6 = ["disabled"];
var _hoisted_12$6 = ["disabled"];
var _hoisted_13$5 = { class: "hint" };
var endpoint$2 = "/api/native/assistant";
// src/components/OnDeviceAssistant.vue
var OnDeviceAssistant_default = /* @__PURE__ */ defineComponent({
	__name: "OnDeviceAssistant",
	setup(__props) {
		const api = useApi();
		const { busy, message, run } = useAction();
		const state = /* @__PURE__ */ ref();
		const url = /* @__PURE__ */ ref("https://api.openai.com/v1");
		const model = /* @__PURE__ */ ref("");
		const key = /* @__PURE__ */ ref("");
		const confirmed = /* @__PURE__ */ ref(false);
		const question = /* @__PURE__ */ ref("");
		function update(value, fields = false) {
			if (!state.value || fields) {
				url.value = value.url || url.value;
				model.value = value.model;
				confirmed.value = value.confirmed;
			}
			state.value = value;
		}
		async function load() {
			if (route.active !== "chatgpt" || busy.value) return;
			try {
				update(await api(endpoint$2));
			} catch (error) {
				message.value = error.message;
			}
		}
		usePolling(load, 1800, () => route.active === "chatgpt");
		function send(action) {
			return run(async () => {
				const data = action === "config" ? {
					url: url.value.trim(),
					model: model.value.trim(),
					key: key.value.trim(),
					confirmed: confirmed.value
				} : action === "ask" ? { text: question.value.trim() } : {};
				update(await api(endpoint$2, {
					action,
					...data
				}), action === "config");
				if (action === "config") key.value = "";
				if (action === "ask") question.value = "";
				message.value = action === "ask" ? "Вопрос отправлен" : "";
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("section", _hoisted_1$10, [
				createBaseVNode("div", _hoisted_2$9, [_cache[10] || (_cache[10] = createBaseVNode("h2", null, "Помощник на колонке", -1)), createBaseVNode("span", _hoisted_3$9, toDisplayString(state.value?.running ? "Запущен" : state.value?.enabled ? "Запускается" : "Остановлен"), 1)]),
				_cache[16] || (_cache[16] = createBaseVNode("p", { class: "hint" }, "Экспериментальный режим для Мини 3 Про. Для проверки сначала останови другой голосовой мост.", -1)),
				unref(message) || state.value?.error ? (openBlock(), createElementBlock("p", _hoisted_4$8, toDisplayString(unref(message) || state.value?.error), 1)) : createCommentVNode("", true),
				state.value ? (openBlock(), createElementBlock("form", {
					key: 1,
					class: "col",
					onSubmit: _cache[7] || (_cache[7] = withModifiers(($event) => send("config"), ["prevent"]))
				}, [
					createBaseVNode("label", null, [_cache[11] || (_cache[11] = createTextVNode("Адрес OpenAI-совместимого API ", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => url.value = $event),
						type: "url",
						class: "field",
						required: ""
					}, null, 512), [[vModelText, url.value]])]),
					createBaseVNode("label", null, [_cache[12] || (_cache[12] = createTextVNode("Модель ", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => model.value = $event),
						class: "field",
						maxlength: "160",
						required: ""
					}, null, 512), [[vModelText, model.value]])]),
					createBaseVNode("label", null, [_cache[13] || (_cache[13] = createTextVNode("Ключ API ", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => key.value = $event),
						type: "password",
						class: "field",
						autocomplete: "new-password",
						placeholder: state.value.has_key ? "Ключ сохранён" : "Если требует провайдер"
					}, null, 8, _hoisted_5$7), [[vModelText, key.value]])]),
					createBaseVNode("label", _hoisted_6$7, [_cache[14] || (_cache[14] = createBaseVNode("span", null, "Разрешить пробный запуск", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => confirmed.value = $event),
						type: "checkbox"
					}, null, 512), [[vModelCheckbox, confirmed.value]])]),
					createBaseVNode("div", _hoisted_7$7, [
						createBaseVNode("button", {
							class: "btn",
							disabled: unref(busy)
						}, "Сохранить настройки", 8, _hoisted_8$7),
						!state.value.installed ? (openBlock(), createElementBlock("button", {
							key: 0,
							type: "button",
							class: "btn",
							disabled: unref(busy),
							onClick: _cache[4] || (_cache[4] = ($event) => send("install"))
						}, "Установить программу", 8, _hoisted_9$7)) : createCommentVNode("", true),
						state.value.enabled ? (openBlock(), createElementBlock("button", {
							key: 1,
							type: "button",
							class: "btn",
							disabled: unref(busy),
							onClick: _cache[5] || (_cache[5] = ($event) => send("stop"))
						}, "Остановить", 8, _hoisted_10$6)) : (openBlock(), createElementBlock("button", {
							key: 2,
							type: "button",
							class: "btn primary",
							disabled: unref(busy) || !state.value.installed || !state.value.confirmed,
							onClick: _cache[6] || (_cache[6] = ($event) => send("start"))
						}, "Запустить", 8, _hoisted_11$6))
					])
				], 32)) : createCommentVNode("", true),
				state.value?.running ? (openBlock(), createElementBlock("form", {
					key: 2,
					class: "row",
					onSubmit: _cache[9] || (_cache[9] = withModifiers(($event) => send("ask"), ["prevent"]))
				}, [createBaseVNode("label", null, [_cache[15] || (_cache[15] = createTextVNode("Проверочный вопрос ", -1)), withDirectives(createBaseVNode("input", {
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => question.value = $event),
					class: "field",
					maxlength: "1000",
					required: ""
				}, null, 512), [[vModelText, question.value]])]), createBaseVNode("button", {
					class: "btn",
					disabled: unref(busy) || !question.value.trim()
				}, "Спросить", 8, _hoisted_12$6)], 32)) : createCommentVNode("", true),
				(openBlock(true), createElementBlock(Fragment, null, renderList(state.value?.history, (item, index) => {
					return openBlock(), createElementBlock("div", {
						key: index,
						class: "set-item"
					}, [createBaseVNode("div", null, [
						createBaseVNode("b", null, toDisplayString(item.question), 1),
						createBaseVNode("div", _hoisted_13$5, toDisplayString(unref(stamp)(item.at)), 1),
						createBaseVNode("p", null, toDisplayString(item.error || item.answer), 1)
					])]);
				}), 128))
			]);
		};
	}
});
// src/pages/ChatgptPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$9 = { class: "page-head" };
var _hoisted_2$8 = { class: "card" };
var _hoisted_3$8 = {
	class: "hint",
	id: "voice-note"
};
var _hoisted_4$7 = ["placeholder"];
var _hoisted_5$6 = { class: "toggle" };
var _hoisted_6$6 = { class: "row" };
var _hoisted_7$6 = ["disabled"];
var _hoisted_8$6 = ["disabled"];
var _hoisted_9$6 = {
	class: "out",
	id: "voice-result"
};
var _hoisted_10$5 = { class: "row" };
var _hoisted_11$5 = ["disabled"];
var _hoisted_12$5 = ["disabled"];
var _hoisted_13$4 = ["disabled"];
// src/pages/ChatgptPage.vue
var ChatgptPage_default = /* @__PURE__ */ defineComponent({
	__name: "ChatgptPage",
	setup(__props) {
		const api = useApi(), url = /* @__PURE__ */ ref(""), token = /* @__PURE__ */ ref(""), compatible = /* @__PURE__ */ ref(false), hasToken = /* @__PURE__ */ ref(false), note = /* @__PURE__ */ ref(""), { busy, message, run } = useAction();
		let baseline = "";
		async function load(force = false) {
			try {
				const v = await api("/api/native/voice");
				if (force || !baseline || !token.value && JSON.stringify([url.value, compatible.value]) === baseline) {
					url.value = v.url;
					compatible.value = v.compatibility_confirmed;
					baseline = JSON.stringify([url.value, compatible.value]);
				}
				hasToken.value = v.has_token;
				note.value = v.note;
			} catch (e) {
				message.value = e.message;
			}
		}
		function save() {
			run(async () => {
				await api("/api/native/voice/config", {
					url: url.value.trim(),
					token: token.value.trim(),
					compatibility_confirmed: compatible.value
				});
				token.value = "";
				message.value = "Настройки сохранены";
				await load(true);
			});
		}
		function service(action) {
			if (action !== "status" && !confirm("Выполнить «" + action + "» для голосового сервиса на Linux-сервере?")) return;
			run(async () => {
				message.value = JSON.stringify(await api("/api/native/voice/" + action, {}), null, 2);
			});
		}
		load();
		useEvents(() => {
			if (route.active === "chatgpt") load();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$9, [createBaseVNode("h1", null, [createVNode(UiIcon_default, { name: "chat" }), _cache[7] || (_cache[7] = createTextVNode("ChatGPT", -1))])]),
				createBaseVNode("section", _hoisted_2$8, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "chat" }), _cache[8] || (_cache[8] = createTextVNode("Голосовой мост на Linux-сервере", -1))]),
					createBaseVNode("p", _hoisted_3$8, toDisplayString(note.value), 1),
					_cache[17] || (_cache[17] = createBaseVNode("p", { class: "hint" }, "Нужны настроенный голосовой сервис, агент DARKLS и защищённое соединение с сервером. Эта вкладка управляет сервисом; она не устанавливает аудиодрайверы и не выполняет вход в ChatGPT.", -1)),
					createBaseVNode("label", null, [_cache[9] || (_cache[9] = createTextVNode("Адрес агента", -1)), withDirectives(createBaseVNode("input", {
						class: "field",
						id: "voice-url",
						type: "url",
						placeholder: "https://voice.example.ru",
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => url.value = $event)
					}, null, 512), [[vModelText, url.value]])]),
					createBaseVNode("label", null, [_cache[10] || (_cache[10] = createTextVNode("Токен агента", -1)), withDirectives(createBaseVNode("input", {
						class: "field",
						id: "voice-token",
						type: "password",
						autocomplete: "new-password",
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => token.value = $event),
						placeholder: hasToken.value ? "Сохранён. Оставь пустым, чтобы сохранить" : "Токен агента"
					}, null, 8, _hoisted_4$7), [[vModelText, token.value]])]),
					createBaseVNode("label", _hoisted_5$6, [_cache[11] || (_cache[11] = createBaseVNode("span", null, "Совместимость аудио с этой колонкой проверена вручную", -1)), withDirectives(createBaseVNode("input", {
						type: "checkbox",
						id: "voice-compatible",
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => compatible.value = $event)
					}, null, 512), [[vModelCheckbox, compatible.value]])]),
					createBaseVNode("div", _hoisted_6$6, [createBaseVNode("button", {
						class: "btn",
						id: "voice-save",
						onClick: save,
						disabled: unref(busy)
					}, [createVNode(UiIcon_default, { name: "check" }), _cache[12] || (_cache[12] = createTextVNode("Сохранить", -1))], 8, _hoisted_7$6), createBaseVNode("button", {
						class: "btn",
						id: "voice-status",
						onClick: _cache[3] || (_cache[3] = ($event) => service("status")),
						disabled: unref(busy)
					}, [createVNode(UiIcon_default, { name: "info" }), _cache[13] || (_cache[13] = createTextVNode("Проверить связь", -1))], 8, _hoisted_8$6)]),
					createBaseVNode("pre", _hoisted_9$6, toDisplayString(unref(message)), 1),
					createBaseVNode("div", _hoisted_10$5, [
						createBaseVNode("button", {
							class: "btn primary",
							id: "voice-start",
							onClick: _cache[4] || (_cache[4] = ($event) => service("start")),
							disabled: unref(busy) || !compatible.value
						}, [createVNode(UiIcon_default, { name: "play" }), _cache[14] || (_cache[14] = createTextVNode("Запустить", -1))], 8, _hoisted_11$5),
						createBaseVNode("button", {
							class: "btn",
							id: "voice-stop",
							onClick: _cache[5] || (_cache[5] = ($event) => service("stop")),
							disabled: unref(busy)
						}, [createVNode(UiIcon_default, { name: "stop" }), _cache[15] || (_cache[15] = createTextVNode("Остановить", -1))], 8, _hoisted_12$5),
						createBaseVNode("button", {
							class: "btn",
							id: "voice-restart",
							onClick: _cache[6] || (_cache[6] = ($event) => service("restart")),
							disabled: unref(busy) || !compatible.value
						}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[16] || (_cache[16] = createTextVNode("Перезапустить", -1))], 8, _hoisted_13$4)
					])
				]),
				createVNode(OnDeviceAssistant_default)
			], 64);
		};
	}
});
// src/pages/BackupsPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$8 = { class: "page-head" };
var _hoisted_2$7 = { class: "card" };
var _hoisted_3$7 = {
	class: "out",
	id: "backup-info"
};
var _hoisted_4$6 = { class: "toggle" };
var _hoisted_5$5 = ["disabled"];
var _hoisted_6$5 = { class: "card" };
var _hoisted_7$5 = ["disabled"];
var _hoisted_8$5 = ["href", "hidden"];
var _hoisted_9$5 = {
	class: "out",
	id: "backup-status"
};
// src/pages/BackupsPage.vue
var BackupsPage_default = /* @__PURE__ */ defineComponent({
	__name: "BackupsPage",
	setup(__props) {
		const api = useApi(), info = /* @__PURE__ */ ref({}), secrets = /* @__PURE__ */ ref(false), file = /* @__PURE__ */ ref(), undo = /* @__PURE__ */ ref(""), { busy, message, run } = useAction();
		const infoText = computed(() => "Последняя созданная копия: " + stamp(info.value.last_backup?.created) + (info.value.last_backup ? " · " + Math.round(info.value.last_backup.size / 1024) + " КБ" : "") + "\nПоследнее восстановление: " + stamp(info.value.last_restore?.at));
		async function load() {
			try {
				info.value = await api("/api/native/backups");
			} catch (e) {
				message.value = e.message;
			}
		}
		function create() {
			run(async () => {
				const v = await api("/api/native/backups/create", { secrets: secrets.value });
				const r = await fetch(contextUrl(v.download), { cache: "no-store" });
				if (!r.ok) throw Error("Не удалось скачать копию");
				download(await r.blob(), v.name);
				message.value = "Копия подготовлена и передана браузеру. Проверь папку загрузок на своём устройстве.";
				await load();
			});
		}
		function restore() {
			run(async () => {
				if (!file.value) throw Error("Выбери архив .tar.gz");
				if (file.value.size > 16777216) throw Error("Максимальный размер — 16 МБ");
				if (!confirm("Восстановить настройки панели из копии? Текущие настройки будут сохранены в копии для отмены. Пароль и системные файлы не меняются.")) {
					message.value = "";
					return;
				}
				const v = await api("/api/native/backups/restore", file.value, { raw: true });
				message.value = v.message;
				undo.value = contextUrl(v.undo.download);
				await load();
			});
		}
		load();
		useEvents(() => {
			if (route.active === "backups") load();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$8, [createBaseVNode("h1", null, [createVNode(UiIcon_default, { name: "archive" }), _cache[2] || (_cache[2] = createTextVNode("Резервные копии", -1))])]),
				createBaseVNode("section", _hoisted_2$7, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "dl" }), _cache[3] || (_cache[3] = createTextVNode("Скачать копию на своё устройство", -1))]),
					_cache[6] || (_cache[6] = createBaseVNode("p", { class: "hint" }, "Настройки панели и снимки конфигураций загрузки, автозапуска и ADB. Это не полный образ памяти. Пароль панели, сессии, runtime, музыка и приложения YAM не включаются.", -1)),
					createBaseVNode("pre", _hoisted_3$7, toDisplayString(infoText.value), 1),
					createBaseVNode("label", _hoisted_4$6, [_cache[4] || (_cache[4] = createBaseVNode("span", null, "Включить секреты: токен Яндекса, агента и бинарную конфигурацию колонки. Архив не зашифрован — храни его приватно.", -1)), withDirectives(createBaseVNode("input", {
						type: "checkbox",
						id: "backup-secrets",
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => secrets.value = $event)
					}, null, 512), [[vModelCheckbox, secrets.value]])]),
					createBaseVNode("button", {
						class: "btn primary",
						id: "backup-create",
						onClick: create,
						disabled: unref(busy)
					}, [createVNode(UiIcon_default, { name: "dl" }), _cache[5] || (_cache[5] = createTextVNode("Создать и скачать", -1))], 8, _hoisted_5$5)
				]),
				createBaseVNode("section", _hoisted_6$5, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "undo" }), _cache[7] || (_cache[7] = createTextVNode("Восстановление настроек", -1))]),
					_cache[9] || (_cache[9] = createBaseVNode("p", { class: "hint" }, "Восстанавливаются только настройки панели и включённые в копию токены. Снимки системных файлов предназначены для ручного восстановления; загрузка, root и прошивка автоматически не меняются. Перед восстановлением создаётся копия для отмены.", -1)),
					createBaseVNode("input", {
						class: "field",
						id: "backup-file",
						type: "file",
						accept: ".gz,.tgz",
						onChange: _cache[1] || (_cache[1] = ($event) => file.value = $event.target.files?.[0])
					}, null, 32),
					createBaseVNode("button", {
						class: "btn danger",
						id: "backup-restore",
						onClick: restore,
						disabled: unref(busy)
					}, [createVNode(UiIcon_default, { name: "undo" }), _cache[8] || (_cache[8] = createTextVNode("Восстановить настройки", -1))], 8, _hoisted_7$5),
					createBaseVNode("a", {
						class: "btn",
						id: "backup-undo",
						href: undo.value,
						hidden: !undo.value
					}, "Скачать копию перед восстановлением", 8, _hoisted_8$5),
					createBaseVNode("pre", _hoisted_9$5, toDisplayString(unref(message)), 1)
				])
			], 64);
		};
	}
});
// src/pages/DiagnosticsPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$7 = { class: "page-head" };
var _hoisted_2$6 = { class: "card" };
var _hoisted_3$6 = { class: "row" };
var _hoisted_4$5 = ["disabled"];
var _hoisted_5$4 = ["disabled"];
var _hoisted_6$4 = {
	class: "hint",
	id: "diagnostic-status"
};
var _hoisted_7$4 = {
	id: "diagnostic-checks",
	"aria-live": "polite"
};
var _hoisted_8$4 = {
	class: "out",
	id: "diagnostic-report"
};
var _hoisted_9$4 = { class: "card" };
var _hoisted_10$4 = {
	class: "out",
	id: "device-json"
};
var _hoisted_11$4 = { class: "card" };
var _hoisted_12$4 = { class: "card-head" };
var _hoisted_13$3 = {
	class: "out",
	id: "adb-log"
};
var _hoisted_14$3 = { class: "card" };
// src/pages/DiagnosticsPage.vue
var DiagnosticsPage_default = /* @__PURE__ */ defineComponent({
	__name: "DiagnosticsPage",
	setup(__props) {
		const api = useApi(), report = /* @__PURE__ */ ref(null), { busy, message, run } = useAction();
		function diagnose() {
			run(async () => {
				report.value = await api("/api/native/diagnostics", {});
				message.value = "Проверено " + stamp(report.value.created) + " · прошивка " + (report.value.firmware?.trim() || "не определена");
			});
		}
		async function refresh() {
			try {
				health.info = await api("/api/darkls/health");
			} catch (e) {
				message.value = e.message;
			}
		}
		function saveReport() {
			if (report.value) download(new Blob([JSON.stringify(report.value, null, 2)], { type: "application/json" }), "alice-diagnostics.json");
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createBaseVNode("header", _hoisted_1$7, [createBaseVNode("div", null, [createBaseVNode("h1", null, [createVNode(UiIcon_default, { name: "shield" }), _cache[0] || (_cache[0] = createTextVNode("Диагностика", -1))]), _cache[1] || (_cache[1] = createBaseVNode("div", { class: "sub" }, "Локальное управление, службы и YAM CLI", -1))]), createBaseVNode("button", {
					class: "btn",
					"data-refresh": "",
					onClick: refresh
				}, [createVNode(UiIcon_default, { name: "refresh" }), _cache[2] || (_cache[2] = createTextVNode("Обновить", -1))])]),
				createBaseVNode("section", _hoisted_2$6, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "shield" }), _cache[3] || (_cache[3] = createTextVNode("Проверка колонки", -1))]),
					createBaseVNode("div", _hoisted_3$6, [createBaseVNode("button", {
						class: "btn primary",
						id: "diagnostic-run",
						onClick: diagnose,
						disabled: unref(busy)
					}, [createVNode(UiIcon_default, { name: "shield" }), _cache[4] || (_cache[4] = createTextVNode("Проверить всё", -1))], 8, _hoisted_4$5), createBaseVNode("button", {
						class: "btn",
						id: "diagnostic-save",
						onClick: saveReport,
						disabled: !report.value
					}, [createVNode(UiIcon_default, { name: "dl" }), _cache[5] || (_cache[5] = createTextVNode("Скачать отчёт", -1))], 8, _hoisted_5$4)]),
					createBaseVNode("p", _hoisted_6$4, toDisplayString(unref(message) || "Прошивка, память, сервисы и соединение с Яндексом. Проверка занимает до 10 секунд."), 1),
					createBaseVNode("div", _hoisted_7$4, [(openBlock(true), createElementBlock(Fragment, null, renderList(report.value?.checks || [], (c, i) => {
						return openBlock(), createBlock(CheckRow_default, {
							key: i,
							name: c.name,
							detail: c.detail ?? "HTTP " + c.http,
							status: c.status
						}, null, 8, [
							"name",
							"detail",
							"status"
						]);
					}), 128))]),
					createBaseVNode("details", null, [_cache[6] || (_cache[6] = createBaseVNode("summary", null, "Полный отчёт", -1)), createBaseVNode("pre", _hoisted_8$4, toDisplayString(report.value ? JSON.stringify(report.value, null, 2) : ""), 1)])
				]),
				createBaseVNode("section", _hoisted_9$4, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "server" }), _cache[7] || (_cache[7] = createTextVNode("Профиль устройства", -1))]), createBaseVNode("pre", _hoisted_10$4, toDisplayString(unref(health).info ? JSON.stringify(unref(health).info.device, null, 2) : "Нет данных"), 1)]),
				createBaseVNode("section", _hoisted_11$4, [createBaseVNode("div", _hoisted_12$4, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "log" }), _cache[8] || (_cache[8] = createTextVNode("Журнал ADB", -1))]), _cache[9] || (_cache[9] = createBaseVNode("a", {
					class: "btn sm",
					href: "#logs"
				}, "Логи Quasar", -1))]), createBaseVNode("pre", _hoisted_13$3, toDisplayString((unref(health).info?.adb?.log || []).map((e) => (/* @__PURE__ */ new Date(e.t * 1e3)).toLocaleTimeString("ru-RU") + " " + e.msg).join("\n")), 1)]),
				createBaseVNode("section", _hoisted_14$3, [
					createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "info" }), _cache[10] || (_cache[10] = createTextVNode("DARKLS Alice Panel 0.7.0", -1))]),
					_cache[11] || (_cache[11] = createBaseVNode("p", { class: "hint" }, "Основа и оформление: dimap/yandex-station-web, MIT. Дополнительно: локальное управление, YAM v2, диагностика и исправление старого adbd.", -1)),
					_cache[12] || (_cache[12] = createBaseVNode("p", { class: "hint" }, "Ограничения профиля Mini 3 Pro сохранены: неподдерживаемые операции не включаются принудительно.", -1)),
					_cache[13] || (_cache[13] = createBaseVNode("a", {
						class: "btn",
						href: "#settings"
					}, "Настройки панели", -1))
				])
			], 64);
		};
	}
});
// src/pages/ConnectionPage.vue
var _sfc_main$8 = {};
var _hoisted_1$6 = {
	class: "card conn-card",
	role: "status",
	"aria-live": "polite"
};
function _sfc_render$8(_ctx, _cache) {
	return openBlock(), createElementBlock("section", _hoisted_1$6, [..._cache[0] || (_cache[0] = [
		createStaticVNode("<div class=\"conn-ring\" id=\"cs-ring\"></div><h1 id=\"cs-title\">Подключение…</h1><p id=\"cs-text\"></p><div class=\"addr\" id=\"cs-addr\"></div><button class=\"btn\" id=\"cs-retry\" hidden>Повторить сейчас</button>", 5),
		createBaseVNode("form", {
			class: "login",
			id: "cs-login",
			hidden: ""
		}, [
			createBaseVNode("input", {
				type: "text",
				name: "username",
				value: "panel",
				autocomplete: "username",
				hidden: ""
			}),
			createBaseVNode("input", {
				type: "password",
				class: "field",
				id: "cs-pass",
				autocomplete: "current-password",
				placeholder: "Пароль",
				"aria-label": "Пароль",
				required: ""
			}),
			createBaseVNode("button", {
				class: "btn primary",
				id: "cs-login-btn"
			}, "Войти"),
			createBaseVNode("p", {
				class: "login-err",
				id: "cs-login-err",
				role: "alert"
			})
		], -1),
		createBaseVNode("details", {
			id: "cs-log-box",
			hidden: ""
		}, [createBaseVNode("summary", null, "Лог подключения"), createBaseVNode("pre", {
			class: "out",
			id: "cs-log"
		})], -1)
	])]);
}
var ConnectionPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$8, [["render", _sfc_render$8]]);
// src/pages/OverviewPage.vue
var _sfc_main$7 = {};
function _sfc_render$7(_ctx, _cache) {
	return openBlock(), createElementBlock(Fragment, null, [
		_cache[0] || (_cache[0] = createStaticVNode("<header class=\"page-head\"><div><h1>Обзор</h1><div class=\"sub\" id=\"ov-sub\">—</div><div class=\"upd-pill\" id=\"ov-update\" hidden><a href=\"#settings\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-up\"></use></svg><span id=\"ov-update-text\">Доступна новая версия панели</span></a><button type=\"button\" id=\"ov-update-hide\" aria-label=\"Скрыть до следующей версии\" title=\"Скрыть до следующей версии\">×</button></div></div><div class=\"actions\"><button class=\"btn\" id=\"ov-edit\" aria-pressed=\"false\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-edit\"></use></svg><span>Настроить</span></button><button class=\"btn\" id=\"q-restart\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-refresh\"></use></svg>Перезапустить Алису</button><button class=\"btn danger\" id=\"reboot\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-power\"></use></svg>Перезагрузить</button></div></header><section class=\"card ov-editbar\" id=\"ov-editbar\" hidden><div class=\"card-head\"><h2>Настройка «Обзора»</h2><div class=\"actions\"><button class=\"btn sm\" id=\"ov-reset\">Виджеты по умолчанию</button><button class=\"btn sm primary\" id=\"ov-done\">Готово</button></div></div><div class=\"ov-opts\"><label class=\"set-item\"><div class=\"set-label\"><b>Визуализатор за 3D-моделью</b><small>Спектр из символов за моделью, пока колонка играет музыку (нужен вход в Яндекс)</small></div><div class=\"set-ctl\"><input type=\"checkbox\" class=\"switch\" id=\"set-viz\"></div></label><label class=\"set-item\"><div class=\"set-label\"><b>Фон в покое</b><small>Пока музыка не играет, символы за моделью медленно переливаются</small></div><div class=\"set-ctl\"><input type=\"checkbox\" class=\"switch\" id=\"set-viz-idle\"></div></label><label class=\"set-item\"><div class=\"set-label\"><b>Приватный режим</b><small>Серийный номер, Wi‑Fi, логин Яндекса, адреса и имена устройств — точками, в «Логах» скрыты Device ID, аккаунт и токены. Чтобы случайный скриншот ничего не выдал; одно значение можно открыть нажатием</small></div><div class=\"set-ctl\"><input type=\"checkbox\" class=\"switch\" id=\"set-private\"></div></label><div id=\"model-settings\" hidden></div><div class=\"set-item set-top\"><div class=\"set-label\"><b>Виджеты</b><small>Перетаскивайте за ⠿ или двигайте стрелками. Убранные можно вернуть отсюда. Тема, пароль, резервная копия — во вкладке <a href=\"#settings\">«Настройки»</a></small></div><div class=\"set-ctl\"><div class=\"chips\" id=\"ov-hidden-list\"></div></div></div></div></section><div class=\"wzone wz-top\" id=\"wz-top\"><section class=\"grid stats\" aria-label=\"Состояние\" data-widget=\"stats\" data-title=\"Состояние\"><div class=\"card stat\"><div class=\"label\">Температура</div><div class=\"value\"><b id=\"st-temp\">—</b><span>°C</span></div><div class=\"bar\"><i id=\"st-temp-bar\"></i></div><div class=\"meta\">процессор</div></div><div class=\"card stat\"><div class=\"label\">Память</div><div class=\"value\"><b id=\"st-mem\">—</b><span id=\"st-mem-u\">МБ</span></div><div class=\"bar\"><i id=\"st-mem-bar\"></i></div><div class=\"meta\" id=\"st-mem-n\">—</div></div><div class=\"card stat\"><div class=\"label\">Wi‑Fi</div><div class=\"value\"><b id=\"st-rssi\">—</b><span>дБм</span></div><div class=\"bar\"><i id=\"st-rssi-bar\"></i></div><div class=\"meta\" id=\"st-wifi-n\">—</div></div><div class=\"card stat\"><div class=\"label\">Аптайм</div><div class=\"value\"><b id=\"st-up\">—</b><span id=\"st-up-u\"></span></div><div class=\"bar\"><i id=\"st-load-bar\"></i></div><div class=\"meta\" id=\"st-load-n\">—</div></div></section></div>", 3)),
		_cache[1] || (_cache[1] = createBaseVNode("div", { class: "cols" }, [createBaseVNode("div", {
			class: "col wzone",
			id: "wz-left"
		}, [
			createBaseVNode("div", {
				class: "model-view",
				id: "model-view",
				"data-widget": "model",
				"data-title": "3D-модель",
				role: "img",
				"aria-label": "3D-модель колонки: дисплей и кольцо повторяют настоящие"
			}, [createBaseVNode("canvas", {
				id: "model-viz",
				"aria-hidden": "true"
			})]),
			createBaseVNode("section", {
				class: "card",
				"data-widget": "volume",
				"data-title": "Громкость"
			}, [
				createBaseVNode("div", { class: "card-head" }, [createBaseVNode("h2", null, "Громкость")]),
				createBaseVNode("div", { class: "vol-main" }, [createBaseVNode("div", {
					class: "vol-big",
					id: "vol-big"
				}, "—"), createBaseVNode("div", null, [createBaseVNode("label", {
					for: "vol-master",
					class: "meta",
					style: {
						"font-weight": "600",
						"color": "var(--text-2)"
					}
				}, "Динамик"), createBaseVNode("input", {
					type: "range",
					id: "vol-master",
					min: "0",
					max: "100",
					step: "5"
				})])]),
				createBaseVNode("div", { class: "chips" }, [
					createBaseVNode("button", {
						class: "pill",
						"data-level": "10"
					}, "Тихо"),
					createBaseVNode("button", {
						class: "pill",
						"data-level": "30"
					}, "30"),
					createBaseVNode("button", {
						class: "pill",
						"data-level": "50"
					}, "50"),
					createBaseVNode("button", {
						class: "pill",
						"data-level": "70"
					}, "70")
				]),
				createBaseVNode("p", { class: "hint" }, "Шкала как на колонке: 0–100 с шагом 5. Если вы вошли в Яндекс, громкость ставит сама Алиса; иначе она пересчитывается по таблице Quasar и пишется прямо в микшер.")
			]),
			createBaseVNode("section", {
				class: "card",
				"data-widget": "light",
				"data-title": "Подсветка"
			}, [
				createBaseVNode("h2", null, "Подсветка"),
				createBaseVNode("div", { class: "ring-row" }, [createBaseVNode("div", {
					class: "ring-preview",
					id: "ring-preview"
				}, [createBaseVNode("svg", {
					viewBox: "-50 -50 100 100",
					"aria-hidden": "true"
				}, [createBaseVNode("path", {
					"fill-rule": "evenodd",
					d: "M0-46a46 46 0 1 1 0 92a46 46 0 1 1 0-92ZM0-25c3.5 0 5.6 2 7.6 5.5l13 22.5c2 3.5 2 6.4.3 9.3c-1.8 3-4.4 4.2-8.4 4.2h-25c-4 0-6.6-1.2-8.4-4.2c-1.7-2.9-1.7-5.8.3-9.3l13-22.5C-5.6-23-3.5-25 0-25Z"
				})])]), createBaseVNode("div", {
					class: "col",
					style: { "gap": "10px" }
				}, [createBaseVNode("div", {
					class: "swatches",
					id: "swatches"
				}, [
					createBaseVNode("button", {
						class: "sw",
						style: { "--c": "#6C47FF" },
						"data-hex": "#6C47FF",
						"aria-label": "Фиолетовый"
					}),
					createBaseVNode("button", {
						class: "sw",
						style: { "--c": "#FF0000" },
						"data-hex": "#FF0000",
						"aria-label": "Красный"
					}),
					createBaseVNode("button", {
						class: "sw",
						style: { "--c": "#FF5A00" },
						"data-hex": "#FF5A00",
						"aria-label": "Оранжевый"
					}),
					createBaseVNode("button", {
						class: "sw",
						style: { "--c": "#00FF00" },
						"data-hex": "#00FF00",
						"aria-label": "Зелёный"
					}),
					createBaseVNode("button", {
						class: "sw",
						style: { "--c": "#0000FF" },
						"data-hex": "#0000FF",
						"aria-label": "Синий"
					}),
					createBaseVNode("button", {
						class: "sw white",
						style: { "--c": "#FFFFFF" },
						"data-hex": "#FFFFFF",
						"aria-label": "Белый"
					}),
					createBaseVNode("label", {
						class: "sw-custom",
						title: "Свой цвет"
					}, [createBaseVNode("svg", {
						width: "14",
						height: "14",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-plus" })]), createBaseVNode("input", {
						type: "color",
						id: "ring-color",
						value: "#6c47ff",
						"aria-label": "Свой цвет"
					})])
				]), createBaseVNode("div", { class: "row" }, [
					createBaseVNode("button", {
						class: "btn sm primary",
						id: "ring-set"
					}, "Включить"),
					createBaseVNode("button", {
						class: "btn sm",
						id: "ring-off"
					}, "Выключить"),
					createBaseVNode("button", {
						class: "btn sm",
						id: "ring-reset",
						title: "Отдать кольцо Алисе: погасить цвет и остановить анимации панели"
					}, "Сбросить")
				])])]),
				createBaseVNode("div", { class: "card-head" }, [createBaseVNode("div", {
					class: "seg",
					id: "pat-kind",
					role: "group",
					"aria-label": "Анимации"
				}, [createBaseVNode("button", {
					"data-k": "ring",
					class: "active"
				}, "Кольцо"), createBaseVNode("button", { "data-k": "clock" }, "Часы")]), createBaseVNode("div", {
					class: "row",
					style: { "gap": "6px" }
				}, [
					createBaseVNode("label", {
						for: "pat-sec",
						class: "meta"
					}, "длительность"),
					createBaseVNode("input", {
						type: "number",
						id: "pat-sec",
						class: "field mono",
						value: "5",
						min: "1",
						max: "600",
						style: {
							"width": "64px",
							"min-height": "36px",
							"padding": "0 8px"
						}
					}),
					createBaseVNode("span", { class: "meta" }, "с"),
					createBaseVNode("button", {
						class: "btn sm icon danger",
						id: "pat-stop",
						"aria-label": "Остановить анимации"
					}, [createBaseVNode("svg", {
						width: "14",
						height: "14",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-stop" })])])
				])]),
				createBaseVNode("div", {
					class: "pat-list",
					id: "patterns"
				}),
				createBaseVNode("p", { class: "hint" }, "Цвет пишется в /sys/class/leds — любая анимация Алисы его перезапишет. Анимации часов показываются и на предпросмотре дисплея.")
			]),
			createBaseVNode("section", {
				class: "card",
				"data-widget": "clock",
				"data-title": "Дисплей часов"
			}, [
				createBaseVNode("div", { class: "card-head" }, [createBaseVNode("h2", null, "Дисплей часов"), createBaseVNode("div", {
					class: "row",
					style: { "gap": "6px" }
				}, [createBaseVNode("span", {
					class: "badge",
					id: "disp-badge",
					hidden: ""
				}), createBaseVNode("button", {
					class: "btn sm",
					id: "disp-stop"
				}, "Вернуть часы")])]),
				createBaseVNode("div", {
					class: "display",
					id: "clock-preview"
				}),
				createBaseVNode("div", {
					class: "seg",
					id: "disp-mode",
					role: "group",
					"aria-label": "Что показывать"
				}, [
					createBaseVNode("button", {
						"data-m": "text",
						class: "active"
					}, "Текст"),
					createBaseVNode("button", { "data-m": "date" }, "Дата"),
					createBaseVNode("button", { "data-m": "temp" }, "Температура"),
					createBaseVNode("button", { "data-m": "timer" }, "Таймер")
				]),
				createBaseVNode("div", {
					class: "col",
					id: "dm-text",
					style: { "gap": "10px" }
				}, [createBaseVNode("input", {
					type: "text",
					id: "clock-text",
					class: "field mono",
					maxlength: "10",
					placeholder: "12:34",
					"aria-label": "Текст на дисплее"
				}), createBaseVNode("div", { class: "extras" }, [
					createBaseVNode("label", null, [createBaseVNode("input", {
						type: "checkbox",
						id: "x-dh"
					}), createTextVNode(" двоеточие ↑")]),
					createBaseVNode("label", null, [createBaseVNode("input", {
						type: "checkbox",
						id: "x-dl"
					}), createTextVNode(" двоеточие ↓")]),
					createBaseVNode("label", null, [createBaseVNode("input", {
						type: "checkbox",
						id: "x-dm"
					}), createTextVNode(" дефис")]),
					createBaseVNode("label", null, [createBaseVNode("input", {
						type: "checkbox",
						id: "x-degree"
					}), createTextVNode(" °")])
				])]),
				createBaseVNode("div", {
					class: "row",
					id: "dm-timer",
					hidden: "",
					style: { "gap": "8px" }
				}, [createBaseVNode("input", {
					type: "text",
					id: "timer-val",
					class: "field mono",
					value: "05:00",
					maxlength: "5",
					"aria-label": "Время таймера, мм:сс",
					style: { "width": "90px" }
				}), createBaseVNode("div", { class: "chips" }, [
					createBaseVNode("button", {
						class: "pill",
						"data-t": "60"
					}, "1 мин"),
					createBaseVNode("button", {
						class: "pill",
						"data-t": "300"
					}, "5 мин"),
					createBaseVNode("button", {
						class: "pill",
						"data-t": "600"
					}, "10 мин"),
					createBaseVNode("button", {
						class: "pill",
						"data-t": "1500"
					}, "25 мин")
				])]),
				createBaseVNode("div", { class: "row" }, [
					createBaseVNode("label", {
						for: "clock-br",
						style: { "min-width": "64px" }
					}, "Яркость"),
					createBaseVNode("input", {
						type: "range",
						id: "clock-br",
						min: "1",
						max: "255",
						value: "160",
						style: {
							"flex": "1",
							"width": "auto"
						}
					}),
					createBaseVNode("span", {
						class: "mono meta",
						id: "clock-br-v",
						style: {
							"min-width": "32px",
							"text-align": "right"
						}
					}, "160")
				]),
				createBaseVNode("div", {
					class: "row",
					style: { "gap": "8px" }
				}, [createBaseVNode("button", {
					class: "btn primary",
					id: "disp-pin",
					style: { "min-height": "42px" }
				}, "Закрепить"), createBaseVNode("button", {
					class: "btn",
					id: "clock-set",
					style: { "min-height": "42px" }
				}, "Показать один раз")]),
				createBaseVNode("p", {
					class: "hint",
					id: "disp-hint"
				}, "Закреплённое держится, пока не нажать «Вернуть часы»: колонка сама перерисовывает дисплей, и Quasar его не затирает. «Один раз» — до смены минуты. По окончании таймера играет его штатный звонок.")
			])
		]), createBaseVNode("div", {
			class: "col wzone",
			id: "wz-right"
		}, [
			createBaseVNode("section", {
				class: "card",
				id: "music-card",
				"data-widget": "music",
				"data-title": "Сейчас играет"
			}, [
				createBaseVNode("div", { class: "card-head" }, [createBaseVNode("h2", null, "Сейчас играет"), createBaseVNode("div", {
					class: "row",
					style: { "gap": "6px" }
				}, [createBaseVNode("span", {
					class: "meta",
					id: "mu-account"
				}), createBaseVNode("button", {
					class: "btn sm ghost",
					id: "mu-logout",
					hidden: ""
				}, "Выйти")])]),
				createBaseVNode("div", {
					id: "mu-login",
					hidden: ""
				}, [
					createBaseVNode("div", { class: "login-grid" }, [createBaseVNode("div", {
						class: "qr",
						id: "mu-qr"
					}, [createBaseVNode("div", { class: "empty" }, "QR-код…")]), createBaseVNode("div", {
						class: "col",
						style: { "gap": "8px" }
					}, [
						createBaseVNode("b", null, "Войдите в Яндекс, чтобы видеть и переключать музыку"),
						createBaseVNode("p", { class: "hint" }, "Отсканируйте QR-код камерой телефона, на котором выполнен вход в Яндекс, и подтвердите вход."),
						createBaseVNode("span", {
							class: "meta",
							id: "mu-qr-status"
						})
					])]),
					createBaseVNode("details", { style: { "margin-top": "12px" } }, [
						createBaseVNode("summary", null, "Не получается? Войти через Яндекс"),
						createBaseVNode("ol", {
							class: "hint",
							style: {
								"padding-left": "18px",
								"margin": "8px 0"
							}
						}, [createBaseVNode("li", null, [createBaseVNode("a", {
							id: "mu-oauth",
							target: "_blank",
							rel: "noopener"
						}, "Откройте страницу входа Яндекса"), createTextVNode(" и войдите.")]), createBaseVNode("li", null, "Скопируйте из адресной строки адрес страницы, куда вас перенаправит, и вставьте сюда.")]),
						createBaseVNode("div", {
							class: "row",
							style: { "gap": "8px" }
						}, [createBaseVNode("input", {
							class: "field mono",
							id: "mu-oauth-url",
							placeholder: "https://music.yandex.ru/#access_token=…",
							style: {
								"flex": "1",
								"min-width": "160px"
							},
							"aria-label": "Адрес после входа"
						}), createBaseVNode("button", {
							class: "btn sm primary",
							id: "mu-oauth-go",
							style: { "min-height": "42px" }
						}, "Готово")])
					]),
					createBaseVNode("p", {
						class: "hint",
						style: { "margin-top": "10px" }
					}, "Токен хранится только на этом компьютере (.yandex_auth.json рядом с server.py).")
				]),
				createBaseVNode("div", {
					id: "mu-player",
					hidden: "",
					class: "col",
					style: { "gap": "14px" }
				}, [
					createBaseVNode("div", { class: "mu-top" }, [createBaseVNode("a", {
						class: "cover mu-cover",
						href: "#player",
						title: "Открыть плеер"
					}, [createBaseVNode("svg", {
						width: "40",
						height: "40",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-music" })])]), createBaseVNode("div", { class: "mu-side" }, [createBaseVNode("div", { class: "np-info" }, [createBaseVNode("div", { class: "np-title mu-title" }, "Ничего не играет"), createBaseVNode("div", { class: "np-artist mu-artist" })]), createBaseVNode("div", {
						class: "controls",
						"data-mu-controls": "full"
					})])]),
					createBaseVNode("div", { class: "progress" }, [
						createBaseVNode("span", { class: "mu-pos" }, "0:00"),
						createBaseVNode("input", {
							type: "range",
							class: "mu-seek",
							min: "0",
							max: "100",
							value: "0",
							step: "1",
							"aria-label": "Позиция в треке"
						}),
						createBaseVNode("span", { class: "mu-dur" }, "0:00")
					]),
					createBaseVNode("div", { class: "mu-bt-note" }, [createBaseVNode("svg", {
						width: "16",
						height: "16",
						"aria-hidden": "true"
					}, [createBaseVNode("use", { href: "#i-bt" })]), createBaseVNode("span", null, [createBaseVNode("b", null, "Музыка с устройства по Bluetooth."), createTextVNode(" Лайки, очередь, перемешивание и перемотка доступны только на самом устройстве.")])]),
					createBaseVNode("form", {
						class: "row mu-ask-form",
						style: { "gap": "8px" }
					}, [createBaseVNode("input", {
						class: "field",
						name: "text",
						placeholder: "Попросить Алису: «включи джаз»",
						style: {
							"flex": "1",
							"min-width": "160px"
						},
						"aria-label": "Команда Алисе"
					}), createBaseVNode("button", {
						class: "btn sm",
						style: { "min-height": "42px" }
					}, "Отправить")]),
					createBaseVNode("p", {
						class: "hint",
						id: "mu-err",
						hidden: ""
					})
				])
			]),
			createBaseVNode("section", {
				class: "card",
				"data-widget": "sounds",
				"data-title": "Звуки"
			}, [
				createBaseVNode("div", { class: "card-head" }, [createBaseVNode("h2", null, "Звуки"), createBaseVNode("button", {
					class: "btn sm danger-soft",
					id: "stop-sound"
				}, [createBaseVNode("svg", {
					width: "14",
					height: "14",
					"aria-hidden": "true"
				}, [createBaseVNode("use", { href: "#i-stop" })]), createTextVNode("Стоп")])]),
				createBaseVNode("div", {
					class: "folders",
					id: "snd-folders",
					role: "group",
					"aria-label": "Папка"
				}),
				createBaseVNode("label", { class: "search" }, [createBaseVNode("svg", {
					width: "16",
					height: "16",
					"aria-hidden": "true"
				}, [createBaseVNode("use", { href: "#i-search" })]), createBaseVNode("input", {
					type: "search",
					id: "snd-filter",
					placeholder: "Найти звук во всех папках",
					"aria-label": "Найти звук"
				})]),
				createBaseVNode("div", {
					class: "sound-list",
					id: "sounds"
				}, [createBaseVNode("div", { class: "empty" }, "Загрузка…")]),
				createBaseVNode("button", {
					class: "drop",
					id: "drop"
				}, "Перетащите аудиофайл сюда или нажмите, чтобы выбрать — он проиграется на колонке"),
				createBaseVNode("input", {
					type: "file",
					id: "file",
					accept: "audio/*",
					hidden: ""
				}),
				createBaseVNode("p", {
					class: "hint",
					id: "ffmpeg-hint"
				})
			]),
			createBaseVNode("section", {
				class: "card",
				"data-widget": "bt",
				"data-title": "Bluetooth"
			}, [
				createBaseVNode("div", { class: "card-head" }, [createBaseVNode("h2", null, "Bluetooth"), createBaseVNode("span", {
					class: "badge",
					id: "bt-badge"
				}, "—")]),
				createBaseVNode("div", { class: "bt-pair" }, [
					createBaseVNode("div", { class: "info" }, [createBaseVNode("b", { id: "bt-pair-text" }, "Скрыта"), createBaseVNode("span", {
						class: "meta",
						id: "bt-pair-hint"
					}, "—")]),
					createBaseVNode("span", {
						class: "bt-left",
						id: "bt-pair-left",
						hidden: ""
					}, "—"),
					createBaseVNode("button", {
						class: "btn sm",
						id: "bt-pair-btn"
					}, "Сделать видимой")
				]),
				createBaseVNode("div", {
					class: "bt-list",
					id: "bt-list"
				}, [createBaseVNode("div", { class: "empty" }, "Загрузка…")]),
				createBaseVNode("div", { class: "vol-bt" }, [
					createBaseVNode("label", { for: "vol-bt" }, "Громкость"),
					createBaseVNode("input", {
						type: "range",
						id: "vol-bt",
						min: "0",
						max: "255"
					}),
					createBaseVNode("span", { id: "vol-bt-v" }, "—")
				])
			]),
			createBaseVNode("section", {
				class: "card",
				"data-widget": "device",
				"data-title": "Об устройстве"
			}, [createBaseVNode("h2", null, "Об устройстве"), createBaseVNode("dl", {
				class: "kv",
				id: "dev-info"
			}, [createBaseVNode("dt", null, "…"), createBaseVNode("dd")])])
		])], -1)),
		_cache[2] || (_cache[2] = createBaseVNode("div", {
			id: "wz-hidden",
			hidden: ""
		}, null, -1))
	], 64);
}
var OverviewPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$7, [["render", _sfc_render$7]]);
// src/components/MediaCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = {
	class: "card",
	id: "media-tools"
};
var _hoisted_2$5 = { class: "card-head" };
var _hoisted_3$5 = {
	class: "hint",
	id: "media-status"
};
var _hoisted_4$4 = ["disabled"];
// src/components/MediaCard.vue
var MediaCard_default = /* @__PURE__ */ defineComponent({
	__name: "MediaCard",
	setup(__props) {
		const api = useApi(), status = /* @__PURE__ */ ref("Проверяем FFmpeg…"), available = /* @__PURE__ */ ref(false), { busy, run } = useAction(status);
		async function load() {
			try {
				const v = await api("/api/native/media");
				status.value = v.detail + (v.compressed_size ? " · на /data " + (v.compressed_size / 1048576).toFixed(1) + " МБ" : "");
				available.value = v.available;
			} catch (e) {
				status.value = e.message;
			}
		}
		function install() {
			if (confirm("Скачать аудио-FFmpeg ARM64 на колонку? Примерно 11 МБ загрузки. Совместимость будет проверена перед установкой.")) run(async () => {
				await api("/api/native/media/install", {}, { timeout: 24e4 });
				await load();
			});
		}
		onMounted(load);
		useEvents(load);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("section", _hoisted_1$5, [
				createBaseVNode("div", _hoisted_2$5, [createBaseVNode("h2", null, [createVNode(UiIcon_default, { name: "music" }), _cache[0] || (_cache[0] = createTextVNode("Аудиоформаты", -1))])]),
				_cache[2] || (_cache[2] = createBaseVNode("p", { class: "hint" }, "FFmpeg работает прямо на колонке. Сжатая копия хранится в /data, рабочая — в оперативной памяти /tmp и восстанавливается после перезагрузки.", -1)),
				createBaseVNode("p", _hoisted_3$5, toDisplayString(status.value), 1),
				withDirectives(createBaseVNode("button", {
					class: "btn primary",
					id: "media-install",
					disabled: unref(busy),
					onClick: install
				}, [createVNode(UiIcon_default, { name: "dl" }), _cache[1] || (_cache[1] = createTextVNode("Установить аудио-FFmpeg", -1))], 8, _hoisted_4$4), [[vShow, !available.value]])
			]);
		};
	}
});
// src/pages/SettingsPage.vue
var SettingsPage_default = /* @__PURE__ */ defineComponent({
	__name: "SettingsPage",
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createVNode(MediaCard_default),
				_cache[0] || (_cache[0] = createBaseVNode("header", { class: "page-head" }, [createBaseVNode("div", null, [createBaseVNode("h1", null, "Настройки"), createBaseVNode("div", { class: "sub" }, "Оформление, доступ к панели и то, что панель хранит на колонке")])], -1)),
				_cache[1] || (_cache[1] = createBaseVNode("div", { class: "settings" }, [
					createBaseVNode("section", { class: "card set-card" }, [
						createBaseVNode("div", { class: "set-head" }, [createBaseVNode("span", { class: "set-ic" }, [createBaseVNode("svg", {
							width: "18",
							height: "18",
							"aria-hidden": "true"
						}, [createBaseVNode("use", { href: "#i-palette" })])]), createBaseVNode("div", null, [createBaseVNode("h2", null, "Оформление"), createBaseVNode("p", null, "Хранится в этом браузере и попадает в резервную копию")])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Тема"), createBaseVNode("small", null, "«Как в системе» следует за светлой и тёмной темой устройства")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("div", {
							class: "seg",
							id: "set-theme",
							role: "group",
							"aria-label": "Тема"
						}, [
							createBaseVNode("button", { "data-v": "auto" }, "Как в системе"),
							createBaseVNode("button", { "data-v": "light" }, "Светлая"),
							createBaseVNode("button", { "data-v": "dark" }, "Тёмная")
						])])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Цвет акцента"), createBaseVNode("small", null, "Кнопки, ссылки, графики и подсветка выбранного")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("div", {
							class: "swatches",
							id: "set-accent",
							role: "group",
							"aria-label": "Цвет акцента"
						}, [
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#6C47FF" },
								"data-v": "",
								"aria-label": "Фиолетовый (по умолчанию)"
							}),
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#2F6BFF" },
								"data-v": "#2F6BFF",
								"aria-label": "Синий"
							}),
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#0F9D8F" },
								"data-v": "#0F9D8F",
								"aria-label": "Бирюзовый"
							}),
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#2E9E4F" },
								"data-v": "#2E9E4F",
								"aria-label": "Зелёный"
							}),
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#F06A1D" },
								"data-v": "#F06A1D",
								"aria-label": "Оранжевый"
							}),
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#E0457B" },
								"data-v": "#E0457B",
								"aria-label": "Розовый"
							}),
							createBaseVNode("button", {
								class: "sw",
								style: { "--c": "#52525B" },
								"data-v": "#52525B",
								"aria-label": "Графит"
							})
						])])]),
						createBaseVNode("label", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Плеер внизу страницы"), createBaseVNode("small", null, "Мини-плеер на всех вкладках, кроме «Плеера». Появляется после входа в Яндекс")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("input", {
							type: "checkbox",
							class: "switch",
							id: "set-minibar"
						})])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "«Обзор»"), createBaseVNode("small", null, "Виджеты, 3D-модель и визуализатор")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
							class: "btn sm",
							id: "set-layout-edit"
						}, "Настроить «Обзор»"), createBaseVNode("button", {
							class: "btn sm",
							id: "set-layout-reset"
						}, "По умолчанию")])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Галерея 3D-моделей"), createBaseVNode("small", null, "Все корпуса, которые знает панель, — без подключения к колонке")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("a", {
							class: "btn sm",
							id: "model-gallery",
							href: "./static/model-preview.html",
							target: "_blank",
							rel: "noopener"
						}, "Открыть ↗")])])
					]),
					createBaseVNode("section", { class: "card set-card" }, [
						createBaseVNode("div", { class: "set-head" }, [createBaseVNode("span", { class: "set-ic" }, [createBaseVNode("svg", {
							width: "18",
							height: "18",
							"aria-hidden": "true"
						}, [createBaseVNode("use", { href: "#i-lock" })])]), createBaseVNode("div", null, [createBaseVNode("h2", null, "Доступ"), createBaseVNode("p", null, "Кто может открыть эту панель")])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Пароль панели"), createBaseVNode("small", { id: "pw-state" }, "—")]), createBaseVNode("div", { class: "set-ctl" }, [
							createBaseVNode("button", {
								class: "btn sm",
								id: "pw-set"
							}, "Задать"),
							createBaseVNode("button", {
								class: "btn sm",
								id: "pw-off",
								hidden: ""
							}, "Убрать"),
							createBaseVNode("button", {
								class: "btn sm",
								id: "pw-logout",
								hidden: ""
							}, "Выйти")
						])]),
						createBaseVNode("form", {
							class: "set-form",
							id: "pw-form",
							hidden: ""
						}, [
							createBaseVNode("input", {
								type: "text",
								name: "username",
								value: "panel",
								autocomplete: "username",
								hidden: ""
							}),
							createBaseVNode("input", {
								type: "password",
								class: "field",
								id: "pw-cur",
								autocomplete: "current-password",
								placeholder: "Текущий пароль",
								"aria-label": "Текущий пароль"
							}),
							createBaseVNode("input", {
								type: "password",
								class: "field",
								id: "pw-new",
								autocomplete: "new-password",
								placeholder: "Новый пароль",
								"aria-label": "Новый пароль",
								minlength: "4"
							}),
							createBaseVNode("input", {
								type: "password",
								class: "field",
								id: "pw-new2",
								autocomplete: "new-password",
								placeholder: "Ещё раз",
								"aria-label": "Повторите пароль"
							}),
							createBaseVNode("div", { class: "actions" }, [createBaseVNode("button", {
								class: "btn sm primary",
								id: "pw-save"
							}, "Сохранить"), createBaseVNode("button", {
								type: "button",
								class: "btn sm",
								id: "pw-cancel"
							}, "Отмена")])
						]),
						createBaseVNode("div", {
							class: "set-item",
							id: "pw-others-row",
							hidden: ""
						}, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Другие входы"), createBaseVNode("small", { id: "pw-others-n" })]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
							class: "btn sm",
							id: "pw-others"
						}, "Завершить")])])
					]),
					createBaseVNode("section", { class: "card set-card" }, [
						createBaseVNode("div", { class: "set-head" }, [createBaseVNode("span", { class: "set-ic" }, [createBaseVNode("svg", {
							width: "18",
							height: "18",
							"aria-hidden": "true"
						}, [createBaseVNode("use", { href: "#i-expand" })])]), createBaseVNode("div", null, [createBaseVNode("h2", null, "Приложение"), createBaseVNode("p", null, "Панель с иконкой и в отдельном окне — на компьютере или телефоне")])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Установить как приложение"), createBaseVNode("small", { id: "app-state" }, "—")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
							class: "btn sm primary",
							id: "app-install",
							hidden: ""
						}, "Установить")])]),
						createBaseVNode("p", {
							class: "set-note",
							id: "app-hint",
							hidden: ""
						}),
						createBaseVNode("div", {
							class: "set-item",
							id: "app-ca-row",
							hidden: ""
						}, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Сертификат HTTPS"), createBaseVNode("small", null, "Чтобы телефон доверял панели по HTTPS. Действует только для локальных адресов")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("a", {
							class: "btn sm",
							href: "ca.crt"
						}, [createBaseVNode("svg", {
							width: "18",
							height: "18",
							"aria-hidden": "true"
						}, [createBaseVNode("use", { href: "#i-dl" })]), createTextVNode("Скачать")])])])
					]),
					createBaseVNode("section", { class: "card set-card" }, [
						createBaseVNode("div", { class: "set-head" }, [createBaseVNode("span", { class: "set-ic" }, [createBaseVNode("svg", {
							width: "18",
							height: "18",
							"aria-hidden": "true"
						}, [createBaseVNode("use", { href: "#i-power" })])]), createBaseVNode("div", null, [createBaseVNode("h2", null, "Колонка"), createBaseVNode("p", { id: "fp-info" }, "Что панель поставила на колонку")])]),
						createBaseVNode("div", { class: "set-item set-top" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Установлено на колонке"), createBaseVNode("small", null, "Остальные функции панели ничего на колонке не хранят")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("div", {
							id: "fp-list",
							class: "fp-list"
						}, [createBaseVNode("span", { class: "meta" }, "—")])])]),
						createBaseVNode("label", {
							class: "set-item",
							id: "privacy-row"
						}, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Блокировать аналитику Яндекса"), createBaseVNode("small", { id: "privacy-state" }, "Адреса сбора статистики (clck, appmetrica, metrica) ведут в никуда. Системный раздел не меняется, Алиса и музыка работают как обычно")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
							class: "btn sm",
							id: "privacy-purge",
							hidden: ""
						}, "Очистить очередь"), createBaseVNode("input", {
							type: "checkbox",
							class: "switch",
							id: "privacy-on",
							disabled: ""
						})])]),
						createBaseVNode("div", { class: "set-item" }, [
							createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Резервная копия"), createBaseVNode("small", null, "Заставка, звук запуска, будильники со звуками, флаги автозапуска, оформление и раскладка. Пароль, вход в Яндекс и история графиков в копию не входят")]),
							createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
								class: "btn sm",
								id: "bk-save"
							}, [createBaseVNode("svg", {
								width: "18",
								height: "18",
								"aria-hidden": "true"
							}, [createBaseVNode("use", { href: "#i-dl" })]), createTextVNode("Скачать")]), createBaseVNode("button", {
								class: "btn sm",
								id: "bk-restore"
							}, [createBaseVNode("svg", {
								width: "18",
								height: "18",
								"aria-hidden": "true"
							}, [createBaseVNode("use", { href: "#i-ul" })]), createTextVNode("Восстановить…")])]),
							createBaseVNode("input", {
								type: "file",
								id: "bk-file",
								accept: ".gz,.tgz,application/gzip",
								hidden: ""
							})
						]),
						createBaseVNode("div", { class: "set-item set-danger" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, "Удалить всё с колонки"), createBaseVNode("small", null, "Вернёт стандартные заставку и звук, удалит будильники и строку автозапуска. Перезагрузка не нужна")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
							class: "btn sm danger",
							id: "fp-reset",
							disabled: ""
						}, "Удалить всё")])])
					]),
					createBaseVNode("section", {
						class: "card set-card",
						id: "upd-card"
					}, [
						createBaseVNode("div", { class: "set-head" }, [createBaseVNode("span", { class: "set-ic" }, [createBaseVNode("svg", {
							width: "18",
							height: "18",
							"aria-hidden": "true"
						}, [createBaseVNode("use", { href: "#i-up" })])]), createBaseVNode("div", null, [createBaseVNode("h2", null, "О панели"), createBaseVNode("p", { id: "upd-sub" }, "Версия и обновления")])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, [createTextVNode("Колонка: "), createBaseVNode("span", { id: "upd-model" }, "—")]), createBaseVNode("small", { id: "upd-model-how" }, "—")])]),
						createBaseVNode("div", { class: "set-item" }, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, [createTextVNode("Версия "), createBaseVNode("span", { id: "upd-version" }, "—")]), createBaseVNode("small", { id: "upd-state" }, "проверяем…")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("button", {
							class: "btn sm",
							id: "upd-check"
						}, "Проверить"), createBaseVNode("a", {
							class: "btn sm",
							id: "upd-repo",
							href: "https://github.com/dimap/yandex-station-web",
							target: "_blank",
							rel: "noopener"
						}, "GitHub ↗")])]),
						createBaseVNode("div", {
							class: "set-item",
							id: "upd-row",
							hidden: ""
						}, [createBaseVNode("div", { class: "set-label" }, [createBaseVNode("b", null, [createTextVNode("Доступна версия "), createBaseVNode("span", { id: "upd-latest" }, "—")]), createBaseVNode("small", { id: "upd-how" }, "—")]), createBaseVNode("div", { class: "set-ctl" }, [createBaseVNode("a", {
							class: "btn sm",
							id: "upd-notes",
							target: "_blank",
							rel: "noopener"
						}, "Что нового ↗"), createBaseVNode("button", {
							class: "btn sm primary",
							id: "upd-go"
						}, "Обновить")])]),
						createBaseVNode("pre", {
							class: "set-cmd",
							id: "upd-cmd",
							hidden: ""
						})
					])
				], -1))
			], 64);
		};
	}
});
// src/pages/PlayerPage.vue
var _sfc_main$6 = {};
function _sfc_render$6(_ctx, _cache) {
	return _cache[0] || (_cache[0] = createStaticVNode("<header class=\"page-head\"><div><h1>Плеер</h1><div class=\"sub\" id=\"pl-source\">—</div></div></header><section class=\"card\" id=\"pl-login\" hidden><h2>Нужен вход в Яндекс</h2><p class=\"hint\">Войдите в виджете «Сейчас играет» на «Обзоре» — по QR-коду или через страницу Яндекса.</p><div class=\"row\"><a class=\"btn primary\" href=\"#overview\">Перейти на «Обзор»</a></div></section><div id=\"pl-body\" class=\"col\" style=\"gap:14px;\"><section class=\"card pl-hero\"><div class=\"pl-cover mu-cover\"><svg width=\"64\" height=\"64\" aria-hidden=\"true\"><use href=\"#i-music\"></use></svg></div><div class=\"col pl-main\" style=\"gap:12px;\"><div class=\"pl-kicker\" id=\"pl-kind\">Трек</div><h2 class=\"pl-title mu-title\">Ничего не играет</h2><div class=\"pl-artist mu-artist\"></div><div class=\"pl-meta\" id=\"pl-meta\"></div><div class=\"progress\"><span class=\"mu-pos\">0:00</span><input type=\"range\" class=\"mu-seek\" min=\"0\" max=\"100\" value=\"0\" step=\"1\" aria-label=\"Позиция в треке\"><span class=\"mu-dur\">0:00</span></div><div class=\"controls pl-controls\" data-mu-controls=\"full\"></div><div class=\"mu-volrow\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-vol\"></use></svg><input type=\"range\" class=\"mu-vol\" min=\"0\" max=\"100\" step=\"5\" aria-label=\"Громкость\"><span class=\"mono mu-vol-v\">—</span></div><form class=\"row mu-ask-form\" style=\"gap:8px;\"><input class=\"field\" name=\"text\" placeholder=\"Попросить Алису: «включи что-нибудь весёлое»\" style=\"flex:1;min-width:160px;\" aria-label=\"Команда Алисе\"><button class=\"btn sm\" style=\"min-height:42px;\">Отправить</button></form></div></section><div class=\"cols pl-body-cols\"><section class=\"card\"><div class=\"card-head\"><h2>Текст песни</h2><span class=\"meta\" id=\"pl-ly-meta\"></span></div><div class=\"lyrics\" id=\"pl-lyrics\"><div class=\"empty\">—</div></div><p class=\"hint\" id=\"pl-ly-src\" hidden></p></section><div class=\"col pl-ya-only\"><section class=\"card\"><div class=\"card-head\"><h2 id=\"pl-q-title\">Очередь</h2><span class=\"meta\" id=\"pl-q-count\"></span></div><div class=\"tlist\" id=\"pl-queue\"><div class=\"empty\">—</div></div></section><section class=\"card\"><h2>Похожие треки</h2><div class=\"tlist\" id=\"pl-similar\"><div class=\"empty\">—</div></div></section></div></div><section class=\"card pl-ya-only\" id=\"pl-artist-card\"><h2>Об исполнителе</h2><div id=\"pl-artist\"><div class=\"empty\">—</div></div></section><section class=\"card\"><details id=\"pl-raw-box\"><summary>Всё, что сообщает колонка</summary><dl class=\"kv\" id=\"pl-raw\" style=\"margin-top:10px;\"></dl></details></section></div>", 3));
}
var PlayerPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$6, [["render", _sfc_render$6]]);
// src/pages/AlarmPage.vue
var _sfc_main$5 = {};
function _sfc_render$5(_ctx, _cache) {
	return _cache[0] || (_cache[0] = createStaticVNode("<header class=\"page-head\"><div><h1>Будильник</h1><div class=\"sub\">Локальный: срабатывает на самой колонке, без интернета и без этого компьютера</div></div><div class=\"actions\"><button class=\"btn primary\" id=\"al-add\"><svg width=\"18\" height=\"18\" aria-hidden=\"true\"><use href=\"#i-plus\"></use></svg>Новый будильник</button></div></header><section class=\"card\" id=\"al-setup\" hidden><div class=\"card-head\"><h2>Будильник не установлен на колонке</h2><span class=\"badge\">нужна установка</span></div><p style=\"margin:0;color:var(--text-2);\">Локальный будильник работает на самой колонке, поэтому на неё нужно поставить несколько файлов. Установка ничего не меняет в прошивке, и её можно в любой момент полностью удалить.</p><ul class=\"al-points\"><li>скрипт будильника, ~8 КБ, и звук по умолчанию (таймер Алисы, ~1,7 МБ) — в <code>/data/quasar/webpanel/alarm</code>;</li><li>файл часового пояса этого компьютера — чтобы колонка знала местное время;</li><li>строка автозапуска в <code>/data/quasar/rootkeeper.sh</code> — тот же хук, что у заставки (копия оригинала сохраняется).</li></ul><div class=\"row\"><button class=\"btn primary\" id=\"al-install\">Установить на колонку</button><span class=\"meta\" id=\"al-install-note\"></span></div></section><section class=\"card\" id=\"al-snoozed\" hidden><div class=\"row\" style=\"justify-content:space-between;\"><span id=\"al-snoozed-text\">—</span><button class=\"btn sm\" id=\"al-snooze-cancel\">Отменить</button></div></section><section class=\"card\" id=\"al-editor\" hidden><div class=\"card-head\"><h2 id=\"al-ed-title\">Новый будильник</h2></div><form class=\"al-form\" id=\"al-form\"><label class=\"f\">Время<input type=\"time\" class=\"field\" id=\"al-time\" required></label><label class=\"f\">Подпись<input type=\"text\" class=\"field\" id=\"al-label\" maxlength=\"40\" placeholder=\"например, «Работа»\"></label><div class=\"f full\"><label class=\"f\" style=\"flex-direction:row;justify-content:space-between;align-items:center;\">Повторять <span class=\"chips\" id=\"al-presets\"><button type=\"button\" class=\"chip\" data-d=\"\">Один раз</button><button type=\"button\" class=\"chip\" data-d=\"12345\">Будни</button><button type=\"button\" class=\"chip\" data-d=\"67\">Выходные</button><button type=\"button\" class=\"chip\" data-d=\"1234567\">Каждый день</button></span></label><div class=\"chips day-chips\" id=\"al-days\" style=\"margin-top:8px;\"></div></div><label class=\"f full\">Что играет <select class=\"field\" id=\"al-mode\"><option value=\"wave\">Моя волна</option><option value=\"show\">Утреннее шоу Алисы</option><option value=\"music\">Включить музыку…</option><option value=\"text\">Попросить Алису…</option><option value=\"sound\">Только звук (полностью локально)</option></select></label><label class=\"f full\" id=\"al-query-l\" hidden><span id=\"al-query-cap\">Что включить</span><input type=\"text\" class=\"field\" id=\"al-query\" maxlength=\"200\"></label><p class=\"hint full\" id=\"al-mode-hint\"></p><label class=\"f full\"><span id=\"al-sound-cap\">Звук</span><span class=\"row\" style=\"flex-wrap:nowrap;\"><select class=\"field\" id=\"al-sound\"></select><button type=\"button\" class=\"btn sm\" id=\"al-sound-play\" title=\"Послушать\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-play\"></use></svg></button><button type=\"button\" class=\"btn sm\" id=\"al-sound-up\" title=\"Загрузить свой\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-ul\"></use></svg></button></span><input type=\"file\" id=\"al-sound-file\" accept=\"audio/*\" hidden></label><label class=\"f\"><span>Громкость: <span id=\"al-vol-v\">50</span>%</span><input type=\"range\" id=\"al-vol\" min=\"1\" max=\"10\" step=\"1\" value=\"5\"></label><label class=\"f\">Нарастание громкости <select class=\"field\" id=\"al-ramp\"><option value=\"0\">Сразу</option><option value=\"30\">За 30 с</option><option value=\"60\">За 1 мин</option><option value=\"180\" selected>За 3 мин</option><option value=\"300\">За 5 мин</option><option value=\"600\">За 10 мин</option></select></label><label class=\"f\">Выключить сам через <select class=\"field\" id=\"al-dur\"><option value=\"5\">5 мин</option><option value=\"10\">10 мин</option><option value=\"15\" selected>15 мин</option><option value=\"30\">30 мин</option><option value=\"60\">1 час</option><option value=\"0\">Не выключать</option></select></label><label class=\"f\">Отложить на <select class=\"field\" id=\"al-snz\"><option value=\"5\">5 мин</option><option value=\"9\" selected>9 мин</option><option value=\"10\">10 мин</option><option value=\"15\">15 мин</option><option value=\"0\">Не откладывать</option></select></label><div class=\"actions full\"><button class=\"btn primary\" id=\"al-save\">Сохранить</button><button type=\"button\" class=\"btn\" id=\"al-cancel\">Отмена</button><button type=\"button\" class=\"btn danger\" id=\"al-del\" hidden>Удалить</button></div></form></section><section class=\"card\" id=\"al-list-card\"><div class=\"card-head\"><h2>Будильники</h2><span class=\"badge\" id=\"al-badge\">—</span></div><div id=\"al-list\"><div class=\"empty\">Загрузка…</div></div></section><div class=\"cols\" id=\"al-cols\"><section class=\"card\"><div class=\"card-head\"><h2>Как это работает</h2></div><div class=\"al-note\"><b>Это отдельный, локальный будильник.</b> Он хранится и срабатывает на самой колонке, поэтому, в отличие от встроенных будильников Алисы, не зависит от интернета, серверов Яндекса и этого компьютера. Будильники из приложения Алисы живут в облаке: здесь их не видно, и работают они как раньше.</div><ul class=\"al-points\"><li><b>Музыка Алисы</b> («Моя волна», утреннее шоу, свой запрос) требует интернета. Если его нет или Алиса за 30 секунд ничего не включила, вместо музыки играет выбранный звук.</li><li><b>Выключить:</b> кнопка на колонке, «Алиса, стоп» или кнопка в панели. <b>Отложить</b> — из панели.</li><li>Время — по часовому поясу этого компьютера: <span id=\"al-tz\">—</span>.</li></ul><div class=\"set-item\" id=\"al-inst-row\" style=\"padding-bottom:0;\"><div class=\"set-label\"><b>Установлено на колонке</b><small id=\"al-inst-info\">—</small></div><div class=\"set-ctl\"><button class=\"btn sm\" id=\"al-update\" hidden>Обновить скрипт</button><button class=\"btn sm danger\" id=\"al-uninstall\">Удалить с колонки</button></div></div></section><section class=\"card\"><div class=\"card-head\"><h2>Журнал</h2><span class=\"meta\" id=\"al-devtime\"></span></div><pre class=\"out\" id=\"al-log\" style=\"max-height:240px;\">—</pre></section></div>", 6));
}
var AlarmPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$5, [["render", _sfc_render$5]]);
// src/pages/ChartsPage.vue
var _sfc_main$4 = {};
function _sfc_render$4(_ctx, _cache) {
	return openBlock(), createElementBlock(Fragment, null, [
		_cache[0] || (_cache[0] = createBaseVNode("header", { class: "page-head" }, [createBaseVNode("div", null, [createBaseVNode("h1", null, "Графики"), createBaseVNode("div", { class: "sub" }, "Раз в 10 секунд за последние сутки. История хранится на компьютере")]), createBaseVNode("div", { class: "actions" }, [
			createBaseVNode("div", {
				class: "seg",
				id: "ch-range",
				role: "group",
				"aria-label": "Период"
			}, [
				createBaseVNode("button", { "data-v": "900" }, "15 мин"),
				createBaseVNode("button", { "data-v": "3600" }, "1 ч"),
				createBaseVNode("button", { "data-v": "21600" }, "6 ч"),
				createBaseVNode("button", { "data-v": "86400" }, "24 ч")
			]),
			createBaseVNode("button", {
				class: "btn sm",
				id: "ch-csv",
				title: "Скачать данные таблицей"
			}, [createBaseVNode("svg", {
				width: "14",
				height: "14",
				"aria-hidden": "true"
			}, [createBaseVNode("use", { href: "#i-dl" })]), createTextVNode("CSV")]),
			createBaseVNode("button", {
				class: "btn sm",
				id: "ch-clear"
			}, "Очистить")
		])], -1)),
		_cache[1] || (_cache[1] = createBaseVNode("div", {
			class: "charts",
			id: "ch-grid"
		}, null, -1)),
		_cache[2] || (_cache[2] = createBaseVNode("section", { class: "card chart-card" }, [
			createBaseVNode("div", { class: "chart-head" }, [createBaseVNode("h2", null, "Воспроизведение"), createBaseVNode("div", {
				class: "chart-val",
				id: "ch-play-v"
			}, "—")]),
			createBaseVNode("div", {
				class: "chart-sub",
				id: "ch-play-sub"
			}, "когда колонка что-то играла (музыка, ответы Алисы, звуки)"),
			createBaseVNode("svg", {
				class: "chart-svg strip",
				id: "ch-play",
				role: "img",
				"aria-label": "Когда колонка играла звук"
			})
		], -1)),
		_cache[3] || (_cache[3] = createStaticVNode("<section class=\"card\"><div class=\"card-head\"><h2>События</h2><span class=\"meta\">отмечены на графиках вертикальными линиями</span></div><div class=\"ev-list\" id=\"ch-events\"><span class=\"meta\">—</span></div></section>", 1))
	], 64);
}
var ChartsPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$4, [["render", _sfc_render$4]]);
// src/pages/BootPage.vue
var _sfc_main$3 = {};
function _sfc_render$3(_ctx, _cache) {
	return _cache[0] || (_cache[0] = createStaticVNode("<header class=\"page-head\"><div><h1>Запуск</h1><div class=\"sub\">Что колонка показывает и играет при включении</div></div></header><div class=\"cols\"><section class=\"card\"><div class=\"card-head\"><h2>Когда показывать</h2><span class=\"badge\" id=\"boot-hook-badge\">—</span></div><label class=\"toggle\"><span>Показывать при каждой загрузке</span><input type=\"checkbox\" id=\"boot-always\"></label><p class=\"hint\">По умолчанию заставка и звук запуска появляются только при первом включении. С этой опцией — при каждом.</p></section><section class=\"card\"><div class=\"card-head\"><h2>Звук запуска</h2><span class=\"badge\" id=\"snd-badge\">—</span></div><div class=\"row\" style=\"gap:8px;\"><button class=\"btn sm\" id=\"bs-play-default\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-play\"></use></svg>Стандартный</button><button class=\"btn sm\" id=\"bs-play-custom\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-play\"></use></svg>Свой</button><button class=\"btn sm danger-soft\" id=\"bs-stop\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-stop\"></use></svg>Стоп</button></div><button class=\"drop\" id=\"bs-drop\">Перетащите аудиофайл или нажмите, чтобы выбрать — он станет звуком запуска</button><input type=\"file\" id=\"bs-file\" accept=\"audio/*\" hidden><div class=\"row\"><button class=\"btn danger\" id=\"bs-reset\">Вернуть стандартный звук</button></div><p class=\"hint\">Файл перекодируется в MP3 44,1 кГц стерео, как оригинальный sounds/common/boot.wav (длительность стандартного — 8 с).</p></section></div><section class=\"card\" id=\"boot-card\"><div class=\"card-head\"><h2>Заставка часов</h2><div class=\"status-line\" id=\"boot-status\">—</div></div><div class=\"frames\" id=\"boot-frames\" aria-label=\"Кадры\"></div><div class=\"boot-grid\"><div class=\"col\"><div class=\"display editable\" id=\"boot-editor\"></div><p class=\"hint\">Нажимайте на сегменты, чтобы включать и выключать их.</p></div><div class=\"col\"><div class=\"row\" style=\"gap:8px;\"><input type=\"text\" id=\"boot-text\" class=\"field mono\" maxlength=\"10\" placeholder=\"HI:YA\" aria-label=\"Текст в кадр\" style=\"flex:1;min-width:100px;\"><button class=\"btn\" id=\"boot-text-apply\" style=\"min-height:42px;\">Текст в кадр</button></div><div class=\"row\" style=\"gap:8px;\"><label for=\"boot-ms\" style=\"min-width:auto;\">Длительность кадра</label><input type=\"number\" id=\"boot-ms\" class=\"field mono\" min=\"10\" max=\"65535\" step=\"10\" style=\"width:100px;\"><span class=\"meta\">мс</span></div><div class=\"row\" style=\"gap:8px;\"><button class=\"btn sm\" id=\"boot-dup\">Дублировать кадр</button><button class=\"btn sm\" id=\"boot-left\" aria-label=\"Сдвинуть кадр влево\">←</button><button class=\"btn sm\" id=\"boot-right\" aria-label=\"Сдвинуть кадр вправо\">→</button><button class=\"btn sm\" id=\"boot-clear\">Очистить</button><button class=\"btn sm danger\" id=\"boot-del\">Удалить кадр</button></div><div class=\"row\" style=\"gap:8px;\"><label for=\"boot-pause\" style=\"min-width:auto;\">Пауза перед заставкой</label><input type=\"number\" id=\"boot-pause\" class=\"field mono\" min=\"0\" max=\"65535\" step=\"100\" value=\"3300\" style=\"width:100px;\"><span class=\"meta\">мс</span></div><p class=\"hint\" id=\"boot-pause-hint\">В стандартной заставке 3,3 с пустого экрана: в первые секунды загрузки дисплей ещё не показывает картинку, и более ранние кадры не видны.</p><div class=\"row\" style=\"gap:8px;padding-top:12px;border-top:1px solid var(--line-2);\"><button class=\"btn sm\" id=\"boot-preview\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-play\"></use></svg>В браузере</button><button class=\"btn sm\" id=\"boot-device\"><svg width=\"14\" height=\"14\" aria-hidden=\"true\"><use href=\"#i-play\"></use></svg>На колонке</button><button class=\"btn sm\" id=\"boot-load-default\">Открыть стандартную</button></div><div class=\"row\" style=\"gap:8px;\"><button class=\"btn primary\" id=\"boot-install\">Установить на загрузку</button><button class=\"btn danger\" id=\"boot-reset\">Сбросить на стандартную</button></div></div></div></section>", 3));
}
var BootPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$3, [["render", _sfc_render$3]]);
// src/pages/FilesPage.vue
var _sfc_main$2 = {};
function _sfc_render$2(_ctx, _cache) {
	return _cache[0] || (_cache[0] = createStaticVNode("<header class=\"page-head\"><div><h1>Файлы</h1><div class=\"sub\">Корень (/) только для чтения — писать можно в /data и /tmp</div></div></header><div class=\"files-grid\"><section class=\"card\"><div class=\"row\" style=\"gap:8px;\"><button class=\"btn sm icon\" id=\"fs-up\" aria-label=\"Наверх\"><svg width=\"16\" height=\"16\" aria-hidden=\"true\"><use href=\"#i-up\"></use></svg></button><button class=\"btn sm icon\" id=\"fs-refresh\" aria-label=\"Обновить\"><svg width=\"16\" height=\"16\" aria-hidden=\"true\"><use href=\"#i-refresh\"></use></svg></button><div class=\"crumbs\" id=\"fs-crumbs\"></div><span class=\"badge\" id=\"fs-rw\"></span></div><div class=\"row\" style=\"gap:8px;\"><select id=\"fs-bookmarks\" class=\"field\" aria-label=\"Быстрый переход\"><option value=\"\">Быстрый переход…</option><option>/data/quasar</option><option>/data/quasar/daemons_logs</option><option>/system/vendor/quasar</option><option>/system/vendor/quasar/sounds</option><option>/tmp</option><option>/etc</option><option>/sys/class/leds</option><option>/</option></select><label class=\"search\" style=\"flex:1;min-width:140px;\"><svg width=\"16\" height=\"16\" aria-hidden=\"true\"><use href=\"#i-search\"></use></svg><input type=\"search\" id=\"fs-filter\" placeholder=\"Фильтр по имени\" aria-label=\"Фильтр по имени\"></label><label class=\"row meta\" style=\"gap:6px;font-weight:600;\"><input type=\"checkbox\" id=\"fs-hidden\" checked> скрытые</label></div><div class=\"row\" style=\"gap:6px;\"><button class=\"btn sm\" id=\"fs-upload\"><svg width=\"15\" height=\"15\" aria-hidden=\"true\"><use href=\"#i-ul\"></use></svg>Загрузить</button><button class=\"btn sm\" id=\"fs-mkdir\"><svg width=\"15\" height=\"15\" aria-hidden=\"true\"><use href=\"#i-folder\"></use></svg>Новая папка</button><button class=\"btn sm\" id=\"fs-newfile\"><svg width=\"15\" height=\"15\" aria-hidden=\"true\"><use href=\"#i-file\"></use></svg>Новый файл</button><input type=\"file\" id=\"fs-file\" multiple hidden></div><div class=\"fs-wrap\" id=\"fs-wrap\"><table class=\"fs\"><thead><tr><th data-sort=\"name\">Имя</th><th data-sort=\"size\">Размер</th><th data-sort=\"mtime\" class=\"hide-sm\">Изменён</th><th class=\"hide-sm\">Права</th><th><span class=\"meta\" style=\"font-weight:600;\">Действия</span></th></tr></thead><tbody id=\"fs-body\"></tbody></table></div><p class=\"hint\">Перетащите файлы на список, чтобы загрузить их в текущую папку.</p></section><section class=\"card\" id=\"fs-preview\"><h2>Просмотр</h2><div class=\"empty\">Выберите файл</div></section></div>", 2));
}
var FilesPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$2, [["render", _sfc_render$2]]);
// src/pages/LogsPage.vue
var _sfc_main$1 = {};
function _sfc_render$1(_ctx, _cache) {
	return _cache[0] || (_cache[0] = createStaticVNode("<header class=\"page-head\"><div><h1>Логи</h1><div class=\"sub\">Демоны Quasar и журнал ядра</div></div></header><section class=\"card\"><div class=\"row\" style=\"gap:8px;\"><select id=\"log-name\" class=\"field\" aria-label=\"Лог\"></select><select id=\"log-lines\" class=\"field\" aria-label=\"Строк\"><option>100</option><option selected>300</option><option>1000</option></select><button class=\"btn sm\" id=\"log-load\" style=\"min-height:42px;\"><svg width=\"16\" height=\"16\" aria-hidden=\"true\"><use href=\"#i-refresh\"></use></svg>Обновить</button><label class=\"toggle\" style=\"min-height:42px;gap:8px;font-size:14px;\"><input type=\"checkbox\" id=\"log-follow\"> авто (3 с)</label><label class=\"toggle\" style=\"min-height:42px;gap:8px;font-size:14px;\" title=\"Device ID, серийный номер, Wi‑Fi и MAC-адреса, логин, номер аккаунта и токены Яндекса\"><input type=\"checkbox\" id=\"log-mask\" checked> скрыть личное</label><label class=\"search\" style=\"flex:1;min-width:160px;\"><svg width=\"16\" height=\"16\" aria-hidden=\"true\"><use href=\"#i-search\"></use></svg><input type=\"search\" id=\"log-filter\" placeholder=\"Фильтр\" aria-label=\"Фильтр\"></label></div><pre class=\"out\" id=\"log-out\">—</pre></section>", 2));
}
var LogsPage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main$1, [["render", _sfc_render$1]]);
// src/pages/ConsolePage.vue
var _sfc_main = {};
var _hoisted_1$4 = { class: "card term-card" };
var _hoisted_2$4 = {
	class: "term-keys",
	"aria-label": "Клавиши терминала"
};
var _hoisted_3$4 = ["data-term-key"];
function _sfc_render(_ctx, _cache) {
	return openBlock(), createElementBlock(Fragment, null, [
		_cache[1] || (_cache[1] = createStaticVNode("<header class=\"page-head\"><div><h1>Консоль</h1><div class=\"sub\">Интерактивная оболочка на колонке, от root</div></div><div class=\"actions\"><span class=\"badge\" id=\"term-state\">—</span><button class=\"btn sm\" id=\"term-new\">Новый сеанс</button></div></header>", 1)),
		createBaseVNode("section", _hoisted_1$4, [createBaseVNode("div", _hoisted_2$4, [(openBlock(), createElementBlock(Fragment, null, renderList([
			["esc", "Esc"],
			["tab", "Tab"],
			["up", "↑"],
			["down", "↓"],
			["left", "←"],
			["right", "→"],
			["interrupt", "Ctrl+C"],
			["eof", "Ctrl+D"]
		], ([key, label]) => {
			return createBaseVNode("button", {
				key,
				class: "btn sm",
				type: "button",
				"data-term-key": key
			}, toDisplayString(label), 9, _hoisted_3$4);
		}), 64))]), _cache[0] || (_cache[0] = createBaseVNode("div", {
			class: "term",
			id: "term"
		}, null, -1))]),
		_cache[2] || (_cache[2] = createBaseVNode("p", { class: "hint" }, [
			createTextVNode("Работает как обычный терминал: Tab — дополнение, ↑ / ↓ — история, Ctrl+C — прервать, Ctrl+D или "),
			createBaseVNode("code", null, "exit"),
			createTextVNode(" — закрыть. Копировать — выделить мышью (или Ctrl+C при выделении), вставить — Ctrl+Shift+V. Программы из пакетов yam доступны по имени.")
		], -1))
	], 64);
}
var ConsolePage_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["render", _sfc_render]]);
// src/components/SceneSteps.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "scene-steps" };
var _hoisted_2$3 = { class: "row" };
var _hoisted_3$3 = ["value", "onChange"];
var _hoisted_4$3 = ["value"];
var _hoisted_5$3 = ["onUpdate:modelValue"];
var _hoisted_6$3 = ["onUpdate:modelValue"];
var _hoisted_7$3 = ["onUpdate:modelValue", "max"];
var _hoisted_8$3 = ["disabled", "onClick"];
var _hoisted_9$3 = ["disabled", "onClick"];
var _hoisted_10$3 = ["disabled", "onClick"];
var _hoisted_11$3 = {
	key: 0,
	class: "scene-branch"
};
var _hoisted_12$3 = ["disabled"];
// src/components/SceneSteps.vue
var SceneSteps_default = /* @__PURE__ */ defineComponent({
	__name: "SceneSteps",
	props: {
		steps: {},
		depth: {}
	},
	setup(__props) {
		const props = __props;
		const actions = [
			[
				"volume",
				"Громкость (%)",
				35
			],
			[
				"ring",
				"Цвет кольца",
				"#8b5cf6"
			],
			[
				"ring-reset",
				"Вернуть кольцо Алисе",
				null
			],
			[
				"wait",
				"Пауза (сек.)",
				2
			],
			[
				"alice",
				"Команда Алисе",
				""
			],
			[
				"if-weekend",
				"Если сегодня выходной",
				null
			]
		];
		function change(step, event) {
			const option = actions.find(([kind]) => kind === event.target.value);
			if (!option) return;
			step.kind = option[0];
			step.value = step.kind === "if-weekend" ? [{
				kind: "wait",
				value: 2
			}] : option[2];
		}
		function move(index, offset) {
			const [step] = props.steps.splice(index, 1);
			if (step) props.steps.splice(index + offset, 0, step);
		}
		return (_ctx, _cache) => {
			const _component_SceneSteps = resolveComponent("SceneSteps", true);
			return openBlock(), createElementBlock(Fragment, null, [createBaseVNode("ol", _hoisted_1$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.steps, (step, index) => {
				return openBlock(), createElementBlock("li", { key: index }, [createBaseVNode("div", _hoisted_2$3, [
					createBaseVNode("select", {
						value: step.kind,
						"aria-label": "Действие",
						onChange: ($event) => change(step, $event)
					}, [(openBlock(), createElementBlock(Fragment, null, renderList(actions, ([kind, label]) => {
						return openBlock(), createElementBlock(Fragment, { key: kind }, [kind !== "if-weekend" || __props.depth < 2 ? (openBlock(), createElementBlock("option", {
							key: 0,
							value: kind
						}, toDisplayString(label), 9, _hoisted_4$3)) : createCommentVNode("", true)], 64);
					}), 64))], 40, _hoisted_3$3),
					step.kind === "ring" ? withDirectives((openBlock(), createElementBlock("input", {
						key: 0,
						"onUpdate:modelValue": ($event) => step.value = $event,
						"aria-label": "Цвет кольца",
						type: "color"
					}, null, 8, _hoisted_5$3)), [[vModelText, step.value]]) : step.kind === "alice" ? withDirectives((openBlock(), createElementBlock("input", {
						key: 1,
						"onUpdate:modelValue": ($event) => step.value = $event,
						"aria-label": "Текст команды",
						maxlength: "200",
						required: ""
					}, null, 8, _hoisted_6$3)), [[vModelText, step.value]]) : step.kind === "volume" || step.kind === "wait" ? withDirectives((openBlock(), createElementBlock("input", {
						key: 2,
						"onUpdate:modelValue": ($event) => step.value = $event,
						"aria-label": "Значение",
						type: "number",
						min: "0",
						max: step.kind === "volume" ? 100 : 300,
						required: ""
					}, null, 8, _hoisted_7$3)), [[
						vModelText,
						step.value,
						void 0,
						{ number: true }
					]]) : createCommentVNode("", true),
					createBaseVNode("button", {
						type: "button",
						class: "btn sm",
						"aria-label": "Выше",
						disabled: !index,
						onClick: ($event) => move(index, -1)
					}, "↑", 8, _hoisted_8$3),
					createBaseVNode("button", {
						type: "button",
						class: "btn sm",
						"aria-label": "Ниже",
						disabled: index === __props.steps.length - 1,
						onClick: ($event) => move(index, 1)
					}, "↓", 8, _hoisted_9$3),
					createBaseVNode("button", {
						type: "button",
						class: "btn sm",
						disabled: __props.steps.length === 1,
						onClick: ($event) => __props.steps.splice(index, 1)
					}, "Удалить шаг", 8, _hoisted_10$3)
				]), step.kind === "if-weekend" && Array.isArray(step.value) ? (openBlock(), createElementBlock("div", _hoisted_11$3, [createVNode(_component_SceneSteps, {
					steps: step.value,
					depth: __props.depth + 1
				}, null, 8, ["steps", "depth"])])) : createCommentVNode("", true)]);
			}), 128))]), createBaseVNode("button", {
				type: "button",
				class: "btn",
				disabled: __props.steps.length >= 24,
				onClick: _cache[0] || (_cache[0] = ($event) => __props.steps.push({
					kind: "wait",
					value: 2
				}))
			}, "Добавить шаг", 8, _hoisted_12$3)], 64);
		};
	}
});
// src/pages/ScenesPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = {
	key: 0,
	class: "hint",
	role: "status"
};
var _hoisted_2$2 = { class: "card" };
var _hoisted_3$2 = {
	key: 0,
	class: "hint"
};
var _hoisted_4$2 = { class: "hint" };
var _hoisted_5$2 = { class: "row" };
var _hoisted_6$2 = ["disabled", "onClick"];
var _hoisted_7$2 = ["disabled", "onClick"];
var _hoisted_8$2 = ["onClick"];
var _hoisted_9$2 = ["disabled", "onClick"];
var _hoisted_10$2 = { class: "card-head" };
var _hoisted_11$2 = { class: "row" };
var _hoisted_12$2 = { class: "row" };
var _hoisted_13$2 = {
	key: 0,
	class: "hint"
};
var _hoisted_14$2 = {
	key: 1,
	class: "row"
};
var _hoisted_15$2 = ["value"];
var _hoisted_16$2 = { class: "row" };
var _hoisted_17$2 = ["disabled"];
var _hoisted_18$2 = {
	key: 1,
	class: "card"
};
var endpoint$1 = "/api/native/scenes";
// src/pages/ScenesPage.vue
var ScenesPage_default = /* @__PURE__ */ defineComponent({
	__name: "ScenesPage",
	setup(__props) {
		const api = useApi();
		const { busy, message, run } = useAction();
		const state = /* @__PURE__ */ ref();
		const id = /* @__PURE__ */ ref("");
		const blank = () => ({
			name: "",
			steps: [{
				kind: "volume",
				value: 35
			}],
			at: "",
			days: [
				0,
				1,
				2,
				3,
				4,
				5,
				6
			]
		});
		const draft = /* @__PURE__ */ ref(blank());
		const days = [
			"Пн",
			"Вт",
			"Ср",
			"Чт",
			"Пт",
			"Сб",
			"Вс"
		];
		async function load() {
			if (busy.value || !online.value || route.active !== "scenes") return;
			try {
				state.value = await api(endpoint$1);
			} catch (error) {
				message.value = error.message;
			}
		}
		usePolling(load, 1500);
		watch([online, () => route.active], load);
		function edit(key = "", scene = blank()) {
			id.value = key;
			draft.value = JSON.parse(JSON.stringify(scene));
		}
		function send(action, key = id.value) {
			return run(async () => {
				state.value = await api(endpoint$1, {
					action,
					id: key,
					...action === "save" ? draft.value : {}
				});
				if (action === "save" || action === "delete" && key === id.value) edit();
				message.value = action === "save" ? "Сценарий сохранён" : "";
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				_cache[9] || (_cache[9] = createBaseVNode("header", { class: "page-head" }, [createBaseVNode("div", null, [createBaseVNode("h1", null, "Сценарии"), createBaseVNode("p", null, "Действия вручную, по расписанию или по своей фразе.")])], -1)),
				unref(message) ? (openBlock(), createElementBlock("p", _hoisted_1$2, toDisplayString(unref(message)), 1)) : createCommentVNode("", true),
				createBaseVNode("section", _hoisted_2$2, [
					createBaseVNode("div", { class: "card-head" }, [_cache[5] || (_cache[5] = createBaseVNode("h2", null, "Мои сценарии", -1)), createBaseVNode("button", {
						class: "btn",
						onClick: load
					}, "Обновить")]),
					!Object.keys(state.value?.items || {}).length ? (openBlock(), createElementBlock("p", _hoisted_3$2, "Здесь появятся сохранённые сценарии.")) : createCommentVNode("", true),
					(openBlock(true), createElementBlock(Fragment, null, renderList(state.value?.items, (scene, key) => {
						return openBlock(), createElementBlock("article", {
							key,
							class: "set-item"
						}, [createBaseVNode("div", null, [createBaseVNode("b", null, toDisplayString(scene.name), 1), createBaseVNode("div", _hoisted_4$2, toDisplayString(scene.at || "Без расписания"), 1)]), createBaseVNode("div", _hoisted_5$2, [
							state.value?.running === key ? (openBlock(), createElementBlock("button", {
								key: 0,
								class: "btn",
								disabled: unref(busy),
								onClick: ($event) => send("stop", key)
							}, "Остановить", 8, _hoisted_6$2)) : (openBlock(), createElementBlock("button", {
								key: 1,
								class: "btn primary",
								disabled: unref(busy) || !!state.value?.running,
								onClick: ($event) => send("run", key)
							}, "Запустить", 8, _hoisted_7$2)),
							createBaseVNode("button", {
								class: "btn",
								onClick: ($event) => edit(key, scene)
							}, "Изменить", 8, _hoisted_8$2),
							createBaseVNode("button", {
								class: "btn",
								disabled: unref(busy) || state.value?.running === key,
								onClick: ($event) => send("delete", key)
							}, "Удалить", 8, _hoisted_9$2)
						])]);
					}), 128))
				]),
				createBaseVNode("form", {
					class: "card",
					onSubmit: _cache[4] || (_cache[4] = withModifiers(($event) => send("save"), ["prevent"]))
				}, [
					createBaseVNode("div", _hoisted_10$2, [createBaseVNode("h2", null, toDisplayString(id.value ? "Изменить сценарий" : "Новый сценарий"), 1), id.value ? (openBlock(), createElementBlock("button", {
						key: 0,
						type: "button",
						class: "btn",
						onClick: _cache[0] || (_cache[0] = ($event) => edit())
					}, "Отмена")) : createCommentVNode("", true)]),
					createBaseVNode("label", _hoisted_11$2, [_cache[6] || (_cache[6] = createTextVNode("Название ", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => draft.value.name = $event),
						maxlength: "80",
						required: ""
					}, null, 512), [[vModelText, draft.value.name]])]),
					createVNode(SceneSteps_default, {
						steps: draft.value.steps,
						depth: 0
					}, null, 8, ["steps"]),
					createBaseVNode("label", _hoisted_12$2, [_cache[7] || (_cache[7] = createTextVNode("По времени колонки ", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => draft.value.at = $event),
						type: "time"
					}, null, 512), [[vModelText, draft.value.at]])]),
					state.value?.time ? (openBlock(), createElementBlock("p", _hoisted_13$2, "Время на колонке " + toDisplayString(state.value.time.slice(11, 16)), 1)) : createCommentVNode("", true),
					draft.value.at ? (openBlock(), createElementBlock("div", _hoisted_14$2, [(openBlock(), createElementBlock(Fragment, null, renderList(days, (day, index) => {
						return createBaseVNode("label", { key: day }, [withDirectives(createBaseVNode("input", {
							"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => draft.value.days = $event),
							type: "checkbox",
							value: index
						}, null, 8, _hoisted_15$2), [[vModelCheckbox, draft.value.days]]), createTextVNode(" " + toDisplayString(day), 1)]);
					}), 64))])) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_16$2, [createBaseVNode("button", {
						class: "btn primary",
						disabled: unref(busy)
					}, "Сохранить сценарий", 8, _hoisted_17$2)])
				], 32),
				state.value?.history.length ? (openBlock(), createElementBlock("section", _hoisted_18$2, [_cache[8] || (_cache[8] = createBaseVNode("h2", null, "Журнал сеанса панели", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(state.value.history, (item) => {
					return openBlock(), createElementBlock("p", {
						key: item.at,
						class: "hint"
					}, toDisplayString(unref(stamp)(item.at)) + " · " + toDisplayString(item.name) + " · " + toDisplayString(item.source) + " · " + toDisplayString(item.result), 1);
				}), 128))])) : createCommentVNode("", true)
			], 64);
		};
	}
});
// src/pages/WakewordPage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = {
	key: 0,
	class: "hint",
	role: "status"
};
var _hoisted_2$1 = { class: "card" };
var _hoisted_3$1 = { class: "card-head" };
var _hoisted_4$1 = { class: "badge" };
var _hoisted_5$1 = {
	key: 0,
	class: "hint",
	role: "status"
};
var _hoisted_6$1 = {
	key: 1,
	class: "row"
};
var _hoisted_7$1 = ["disabled"];
var _hoisted_8$1 = ["disabled"];
var _hoisted_9$1 = { class: "card" };
var _hoisted_10$1 = { key: 0 };
var _hoisted_11$1 = {
	key: 1,
	class: "hint",
	role: "status"
};
var _hoisted_12$1 = { key: 2 };
var _hoisted_13$1 = { class: "row" };
var _hoisted_14$1 = ["disabled"];
var _hoisted_15$1 = ["disabled"];
var _hoisted_16$1 = ["disabled"];
var _hoisted_17$1 = ["disabled"];
var _hoisted_18$1 = ["disabled"];
var _hoisted_19$1 = {
	key: 0,
	class: "card"
};
var _hoisted_20$1 = { class: "row" };
var _hoisted_21$1 = [
	"checked",
	"disabled",
	"onChange"
];
var _hoisted_22 = [
	"value",
	"disabled",
	"aria-label",
	"onChange"
];
var _hoisted_23 = ["value"];
var endpoint = "/api/native/wakeword";
// src/pages/WakewordPage.vue
var WakewordPage_default = /* @__PURE__ */ defineComponent({
	__name: "WakewordPage",
	setup(__props) {
		const api = useApi();
		const { busy, message, run } = useAction();
		const state = /* @__PURE__ */ ref();
		const scenes = /* @__PURE__ */ ref({});
		const name = /* @__PURE__ */ ref("");
		async function refresh() {
			const [next, list] = await Promise.all([api(endpoint), api("/api/native/scenes")]);
			state.value = next;
			scenes.value = list.items;
		}
		async function load() {
			if (busy.value || !online.value || route.active !== "wakeword") return;
			try {
				await refresh();
			} catch (error) {
				message.value = error.message;
			}
		}
		usePolling(load, 2500);
		watch([online, () => route.active], load);
		function send(action, data) {
			return run(async () => {
				await api(endpoint, {
					action,
					...data
				});
				await refresh();
				message.value = "";
			});
		}
		function daemon(path, data = {}) {
			return send("daemon", {
				path,
				data
			});
		}
		function install() {
			return run(async () => {
				await api("/api/yam2/action", {
					action: "install",
					name: "tangenx/wakeword"
				}, { timeout: 245e3 });
				await refresh();
				message.value = "Пакет установлен";
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				_cache[15] || (_cache[15] = createBaseVNode("header", { class: "page-head" }, [createBaseVNode("div", null, [createBaseVNode("h1", null, "Свои слова активации"), createBaseVNode("p", null, "Обучи фразу для вызова Алисы, помощника или сценария.")])], -1)),
				unref(message) ? (openBlock(), createElementBlock("p", _hoisted_1$1, toDisplayString(unref(message)), 1)) : createCommentVNode("", true),
				createBaseVNode("section", _hoisted_2$1, [
					createBaseVNode("div", _hoisted_3$1, [_cache[7] || (_cache[7] = createBaseVNode("h2", null, "Демон активации", -1)), createBaseVNode("span", _hoisted_4$1, toDisplayString(state.value?.audio?.ok ? "Микрофон доступен" : state.value?.enabled ? "Включён в настройках" : "Выключен"), 1)]),
					_cache[8] || (_cache[8] = createBaseVNode("p", { class: "hint" }, "Экспериментальная функция. После включения демон запускается вместе с панелью и слушает микрофон колонки.", -1)),
					state.value?.error || state.value?.audio?.error ? (openBlock(), createElementBlock("p", _hoisted_5$1, toDisplayString(state.value.error || state.value.audio?.error), 1)) : createCommentVNode("", true),
					state.value ? (openBlock(), createElementBlock("div", _hoisted_6$1, [!state.value.installed ? (openBlock(), createElementBlock("button", {
						key: 0,
						class: "btn primary",
						disabled: unref(busy),
						onClick: install
					}, "Установить через YAM v2", 8, _hoisted_7$1)) : createCommentVNode("", true), state.value.installed || state.value.enabled ? (openBlock(), createElementBlock("button", {
						key: 1,
						class: "btn",
						disabled: unref(busy),
						onClick: _cache[0] || (_cache[0] = ($event) => send("config", { enabled: !state.value.enabled }))
					}, toDisplayString(state.value.enabled ? "Выключить" : "Включить"), 9, _hoisted_8$1)) : createCommentVNode("", true)])) : createCommentVNode("", true)
				]),
				state.value?.ready ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("section", _hoisted_9$1, [
					_cache[10] || (_cache[10] = createBaseVNode("h2", null, "Обучение", -1)),
					state.value.train?.active ? (openBlock(), createElementBlock("p", _hoisted_10$1, "Идёт обучение…")) : state.value.train?.error ? (openBlock(), createElementBlock("p", _hoisted_11$1, toDisplayString(state.value.train.error), 1)) : createCommentVNode("", true),
					state.value.enroll ? (openBlock(), createElementBlock("div", _hoisted_12$1, [createBaseVNode("p", null, toDisplayString(state.value.enroll.name) + " · Записано " + toDisplayString(state.value.enroll.takes.length) + " / " + toDisplayString(state.value.enroll.min_takes), 1), createBaseVNode("div", _hoisted_13$1, [
						createBaseVNode("button", {
							class: "btn",
							disabled: unref(busy),
							onClick: _cache[1] || (_cache[1] = ($event) => daemon("/enroll/ambient"))
						}, "Записать фон", 8, _hoisted_14$1),
						createBaseVNode("button", {
							class: "btn",
							disabled: unref(busy),
							onClick: _cache[2] || (_cache[2] = ($event) => daemon("/enroll/take"))
						}, "Записать фразу", 8, _hoisted_15$1),
						createBaseVNode("button", {
							class: "btn primary",
							disabled: unref(busy) || state.value.enroll.takes.length < state.value.enroll.min_takes,
							onClick: _cache[3] || (_cache[3] = ($event) => daemon("/enroll/train"))
						}, "Обучить", 8, _hoisted_16$1),
						createBaseVNode("button", {
							class: "btn",
							disabled: unref(busy),
							onClick: _cache[4] || (_cache[4] = ($event) => daemon("/enroll/cancel"))
						}, "Отмена", 8, _hoisted_17$1)
					])])) : (openBlock(), createElementBlock("form", {
						key: 3,
						class: "row",
						onSubmit: _cache[6] || (_cache[6] = withModifiers(($event) => daemon("/enroll/start", { name: name.value.trim() }), ["prevent"]))
					}, [createBaseVNode("label", null, [_cache[9] || (_cache[9] = createTextVNode("Новая фраза ", -1)), withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => name.value = $event),
						maxlength: "80",
						required: ""
					}, null, 512), [[vModelText, name.value]])]), createBaseVNode("button", {
						class: "btn primary",
						disabled: unref(busy) || state.value.train?.active || !name.value.trim()
					}, "Начать обучение", 8, _hoisted_18$1)], 32))
				]), state.value.words?.length ? (openBlock(), createElementBlock("section", _hoisted_19$1, [_cache[14] || (_cache[14] = createBaseVNode("h2", null, "Обученные фразы", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(state.value.words, (word) => {
					return openBlock(), createElementBlock("div", {
						key: word.id,
						class: "set-item"
					}, [createBaseVNode("b", null, toDisplayString(word.name), 1), createBaseVNode("div", _hoisted_20$1, [createBaseVNode("label", null, [createBaseVNode("input", {
						type: "checkbox",
						checked: word.enabled,
						disabled: unref(busy),
						onChange: ($event) => daemon("/words/" + word.id, { enabled: $event.target.checked })
					}, null, 40, _hoisted_21$1), _cache[11] || (_cache[11] = createTextVNode(" Включена", -1))]), createBaseVNode("select", {
						value: state.value.bindings[word.id] || "",
						disabled: unref(busy),
						"aria-label": "Действие для " + word.name,
						onChange: ($event) => send("bind", {
							word: word.id,
							scene: $event.target.value
						})
					}, [
						_cache[12] || (_cache[12] = createBaseVNode("option", { value: "" }, "Позвать Алису", -1)),
						_cache[13] || (_cache[13] = createBaseVNode("option", { value: "@assistant" }, "Помощник на колонке", -1)),
						(openBlock(true), createElementBlock(Fragment, null, renderList(scenes.value, (scene, key) => {
							return openBlock(), createElementBlock("option", {
								key,
								value: key
							}, toDisplayString(scene.name), 9, _hoisted_23);
						}), 128))
					], 40, _hoisted_22)])]);
				}), 128))])) : createCommentVNode("", true)], 64)) : createCommentVNode("", true)
			], 64);
		};
	}
});
// src/App.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "shell" };
var _hoisted_2 = ["hidden"];
var _hoisted_3 = ["hidden"];
var _hoisted_4 = ["hidden"];
var _hoisted_5 = ["hidden"];
var _hoisted_6 = ["hidden"];
var _hoisted_7 = ["hidden"];
var _hoisted_8 = ["hidden"];
var _hoisted_9 = ["hidden"];
var _hoisted_10 = ["hidden"];
var _hoisted_11 = ["hidden"];
var _hoisted_12 = ["hidden"];
var _hoisted_13 = ["hidden"];
var _hoisted_14 = ["hidden"];
var _hoisted_15 = ["hidden"];
var _hoisted_16 = ["hidden"];
var _hoisted_17 = ["hidden"];
var _hoisted_18 = ["hidden"];
var _hoisted_19 = ["hidden"];
var _hoisted_20 = ["hidden"];
var _hoisted_21 = {
	key: 0,
	class: "card",
	role: "alert"
};
// src/App.vue
var App_default = /* @__PURE__ */ defineComponent({
	__name: "App",
	setup(__props) {
		const start = useDeviceControls(), fatal = /* @__PURE__ */ ref(""), reload = () => location.reload();
		onMounted(async () => {
			try {
				await start();
				document.documentElement.dataset.appReady = "true";
			} catch (e) {
				fatal.value = e.message;
			}
		});
		onBeforeUnmount(() => removeEventListener("hashchange", syncRoute));
		watch(() => route.active, (next, old) => {
			if (next !== old) window.scrollTo({ top: 0 });
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [
				createVNode(IconSprite_default),
				createBaseVNode("div", _hoisted_1, [
					createVNode(Sidebar_default),
					createBaseVNode("main", {
						id: "tab-home",
						"data-page": "",
						class: "darkls-page",
						hidden: unref(route).active !== "home" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(HomePage_default)], 8, _hoisted_2),
					createBaseVNode("main", {
						id: "tab-apps",
						"data-page": "",
						hidden: unref(route).active !== "apps" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(AppsPage_default)], 8, _hoisted_3),
					createBaseVNode("main", {
						id: "tab-yam",
						"data-page": "",
						hidden: unref(route).active !== "yam" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(YamPage_default)], 8, _hoisted_4),
					createBaseVNode("main", {
						id: "tab-updates",
						"data-page": "",
						hidden: unref(route).active !== "updates" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(UpdatesPage_default)], 8, _hoisted_5),
					createBaseVNode("main", {
						id: "tab-chatgpt",
						"data-page": "",
						hidden: unref(route).active !== "chatgpt" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(ChatgptPage_default)], 8, _hoisted_6),
					createBaseVNode("main", {
						id: "tab-backups",
						"data-page": "",
						hidden: unref(route).active !== "backups" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(BackupsPage_default)], 8, _hoisted_7),
					createBaseVNode("main", {
						id: "tab-diagnostics",
						"data-page": "",
						class: "darkls-page",
						hidden: unref(route).active !== "diagnostics" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(DiagnosticsPage_default)], 8, _hoisted_8),
					createVNode(LoginDialog_default),
					_cache[0] || (_cache[0] = createBaseVNode("div", {
						id: "darkls-toast",
						role: "status",
						hidden: ""
					}, null, -1)),
					createBaseVNode("main", {
						id: "conn-screen",
						hidden: unref(online) || unref(direct).has(unref(route).active)
					}, [createVNode(ConnectionPage_default)], 8, _hoisted_9),
					createBaseVNode("main", {
						id: "tab-overview",
						"data-page": "",
						hidden: unref(route).active !== "overview" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(OverviewPage_default)], 8, _hoisted_10),
					createBaseVNode("main", {
						id: "tab-settings",
						"data-page": "",
						hidden: unref(route).active !== "settings" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(SettingsPage_default)], 8, _hoisted_11),
					createBaseVNode("main", {
						id: "tab-player",
						"data-page": "",
						hidden: unref(route).active !== "player" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(PlayerPage_default)], 8, _hoisted_12),
					createBaseVNode("main", {
						id: "tab-alarm",
						"data-page": "",
						hidden: unref(route).active !== "alarm" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(AlarmPage_default)], 8, _hoisted_13),
					createBaseVNode("main", {
						id: "tab-charts",
						"data-page": "",
						hidden: unref(route).active !== "charts" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(ChartsPage_default)], 8, _hoisted_14),
					createBaseVNode("main", {
						id: "tab-boot",
						"data-page": "",
						hidden: unref(route).active !== "boot" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(BootPage_default)], 8, _hoisted_15),
					createBaseVNode("main", {
						id: "tab-files",
						"data-page": "",
						hidden: unref(route).active !== "files" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(FilesPage_default)], 8, _hoisted_16),
					createBaseVNode("main", {
						id: "tab-logs",
						"data-page": "",
						hidden: unref(route).active !== "logs" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(LogsPage_default)], 8, _hoisted_17),
					createBaseVNode("main", {
						id: "tab-console",
						"data-page": "",
						hidden: unref(route).active !== "console" || !unref(online) && !unref(direct).has(unref(route).active)
					}, [createVNode(ConsolePage_default)], 8, _hoisted_18),
					createBaseVNode("main", {
						hidden: !unref(online) || unref(route).active !== "scenes",
						id: "tab-scenes",
						"data-page": ""
					}, [createVNode(ScenesPage_default)], 8, _hoisted_19),
					createBaseVNode("main", {
						hidden: !unref(online) || unref(route).active !== "wakeword",
						id: "tab-wakeword",
						"data-page": ""
					}, [createVNode(WakewordPage_default)], 8, _hoisted_20)
				]),
				createVNode(DeviceOverlays_default),
				fatal.value ? (openBlock(), createElementBlock("div", _hoisted_21, [createTextVNode(toDisplayString(fatal.value) + " ", 1), createBaseVNode("button", {
					class: "btn",
					onClick: reload
				}, "Повторить загрузку")])) : createCommentVNode("", true)
			], 64);
		};
	}
});
// src/main.ts
addEventListener("hashchange", syncRoute);
createApp(App_default).mount("#app");
