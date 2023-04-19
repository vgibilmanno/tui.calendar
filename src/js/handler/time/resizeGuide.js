/**
 * @fileoverview Module for Time.Resize effect while dragging.
 */
'use strict';

var util = require('tui-code-snippet');
var config = require('../../config');
var domutil = require('../../common/domutil');
var reqAnimFrame = require('../../common/reqAnimFrame');
var ratio = require('../../common/common').ratio;
var datetime = require('../../common/datetime');
var TZDate = require('../../common/timezone').Date;

/**
 * Class for Time.Resize effect.
 * @constructor
 * @param {TimeResize} timeResize - the instance of TimeResize handler.
 */
function TimeResizeGuide(timeResize) {
    /**
     * @type {HTMLElement}
     */
    this.guideElement = null;

    /**
     * @type {TimeResize}
     */
    this.timeResize = timeResize;

    /**
     * @type {function}
     */
    this._getTopFunc = null;

    /**
     * @type {HTMLElement}
     */
    this._originScheduleElement = null;

    /**
     * @type {number}
     */
    this._startTopPixel = 0;

    /**
     * @type {number}
     */
    this._startHeightPixel = 0;

    /**
     * @type {number}
     */
    this._startGridY = 0;

    /**
     * @type {Schedule}
     */
    this._schedule = null;

    /**
     * @type {object}
     */
    this._startDrag = null;

    /**
     * @type {boolean}
     */
    this._isResizeHandleTop = false;

    timeResize.on({
        'timeResizeDragstart': this._onDragStart,
        'timeResizeDrag': this._onDrag,
        'timeResizeDragend': this._clearGuideElement,
        'timeResizeClick': this._clearGuideElement
    }, this);
}

/**
 * Destroy method
 */
TimeResizeGuide.prototype.destroy = function() {
    this._clearGuideElement();
    this.timeResize.off(this);
    this.guideElement = this.timeResize = this._getTopFunc = this._startDrag =
        this._originScheduleElement = this._startHeightPixel =
        this._startGridY = this._startTopPixel = null;
};

/**
 * Clear guide element.
 */
TimeResizeGuide.prototype._clearGuideElement = function() {
    var guideElement = this.guideElement,
        originElement = this._originScheduleElement;

    if (!util.browser.msie) {
        domutil.removeClass(global.document.body, config.classname('resizing'));
    }

    if (originElement) {
        originElement.style.display = 'block';
    }

    domutil.remove(guideElement);

    this.guideElement = this._getTopFunc = this._startDrag = this._originScheduleElement =
        this._startHeightPixel = this._startGridY = this._startTopPixel = null;
};

/**
 * Class for RefreshGuideElementParameters.
 * @constructor
 * @param {number} guideHeight - guide element's style height.
 * @param {number} minTimeHeight - time element's min height
 * @param {number} timeHeight - time element's height.
 * @param {number} top - number that tells where the schedule should be placed relative to top of grid
 */
function RefreshGuideElementParameters(guideHeight, minTimeHeight, timeHeight, top) {
    this.guideHeight = guideHeight;
    this.minTimeHeight = minTimeHeight;
    this.timeHeight = timeHeight;
    this.top = top;
}

/**
 * Refresh guide element
 * @param {RefreshGuideElementParameters} params - instance of RefreshGuideElementParameters.
 * @param {TZDate} start - relative time value of dragstart point
 * @param {TZDate} end - relative time value of dragend point
 */
TimeResizeGuide.prototype._refreshGuideElement = function(params, start, end) {
    var guideElement = this.guideElement;
    var timeElement;

    if (!guideElement) {
        return;
    }

    timeElement = domutil.find(config.classname('.time-schedule-content-time'), params.guideElement);

    reqAnimFrame.requestAnimFrame(function() {
        guideElement.style.height = params.guideHeight + 'px';
        guideElement.style.display = 'block';

        if (timeElement) {
            timeElement.style.height = params.timeHeight + 'px';
            timeElement.style.minHeight = params.minTimeHeight + 'px';
            timeElement.innerHTML = datetime.format(start, 'HH:mm') +
                ' - ' + datetime.format(end, 'HH:mm');
            domutil.setPosition(guideElement, 0, params.top);
        }
    });
};

/**
 * TimeMove#timeMoveDragstart event handler
 * @param {object} dragStartEventData - dragstart event data
 */
TimeResizeGuide.prototype._onDragStart = function(dragStartEventData) {
    var originElement = domutil.closest(
            dragStartEventData.target,
            config.classname('.time-date-schedule-block')
        ),
        schedule = dragStartEventData.schedule,
        guideElement;

    var isTopTimeResizeHandle = domutil.hasClass(dragStartEventData.target, config.classname('time-resize-handle-top'));
    this._isResizeHandleTop = isTopTimeResizeHandle;

    if (!util.browser.msie) {
        domutil.addClass(global.document.body, config.classname('resizing'));
    }

    if (!originElement || !schedule) {
        return;
    }

    this._startGridY = dragStartEventData.nearestGridY;
    this._startHeightPixel = parseFloat(originElement.style.height);
    this._startTopPixel = parseFloat(originElement.style.top);

    this._originScheduleElement = originElement;
    this._schedule = schedule;
    this._startDrag = dragStartEventData;

    guideElement = this.guideElement = originElement.cloneNode(true);
    domutil.addClass(guideElement, config.classname('time-guide-resize'));

    originElement.style.display = 'none';
    dragStartEventData.relatedView.container.appendChild(guideElement);
};

/**
 * @param {object} dragEventData - event data from Drag#drag.
 */
TimeResizeGuide.prototype._onDrag = function(dragEventData) {
    var timeView = dragEventData.relatedView,
        viewOptions = timeView.options,
        viewHeight = timeView.getViewBound().height,
        hourLength = viewOptions.hourEnd - viewOptions.hourStart,
        guideElement = this.guideElement,
        guideTop = parseFloat(guideElement.style.top),
        gridYOffset = dragEventData.nearestGridY - this._startGridY,
        gridYOffsetPixel = ratio(hourLength, viewHeight, gridYOffset),
        goingDuration = this._schedule.goingDuration,
        modelDuration = this._schedule.duration() / datetime.MILLISECONDS_PER_MINUTES,
        comingDuration = this._schedule.comingDuration,
        gridDiff = dragEventData.nearestGridY - this._startDrag.nearestGridY,
        minutesLength = hourLength * 60,
        timeHeight,
        timeMinHeight,
        minHeight,
        maxHeight,
        top,
        start,
        end,
        height,
        params;

    top = this._startTopPixel;
    if (!this._isResizeHandleTop) {
        start = new TZDate(this._schedule.getStarts());
        end = new TZDate(this._schedule.getEnds()).addMinutes(datetime.minutesFromHours(gridDiff));
        if (end.getTime() <= start.getTime()) {
            return;
        }

        height = (this._startHeightPixel + gridYOffsetPixel);

        // at least large than 15min from schedule start time.
        minHeight = guideTop + ratio(hourLength, viewHeight, 0.25);
        minHeight -= this._startTopPixel;
        timeMinHeight = minHeight;
        minHeight += ratio(minutesLength, viewHeight, goingDuration) + ratio(minutesLength, viewHeight, comingDuration);
        // smaller than 24h
        maxHeight = viewHeight - guideTop;

        height = Math.max(height, minHeight);
        height = Math.min(height, maxHeight);
        timeHeight = ratio(minutesLength, viewHeight, modelDuration) + gridYOffsetPixel;
    } else {
        start = new TZDate(this._schedule.getStarts()).addMinutes(datetime.minutesFromHours(gridDiff));
        end = new TZDate(this._schedule.getEnds());
        if (start.getTime() >= end.getTime()) {
            return;
        }

        top = top + gridYOffsetPixel;
        height = (this._startHeightPixel - gridYOffsetPixel);
    }

    params = new RefreshGuideElementParameters(height, timeMinHeight, timeHeight, top);
    this._refreshGuideElement(params, start, end);
};

module.exports = TimeResizeGuide;
