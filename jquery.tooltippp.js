;( function( $, window, document, undefined )
{
	'use strict';

	var $window			= $( window ),
		$document		= $( document ),

		throttle = function( delay, fn )
		{
			var last, deferTimer;
			return function()
			{
				var context = this, args = arguments, now = +new Date;
				if( last && now < last + delay )
				{
					clearTimeout( deferTimer );
					deferTimer = setTimeout( function(){ last = now; fn.apply( context, args ); }, delay );
				}
				else
				{
					last = now;
					fn.apply( context, args );
				}
			};
		},

		wasTouched = function( e )
		{
			if( window.navigator.pointerEnabled || window.navigator.msPointerEnabled )
			{
				if( typeof e === 'undefined' || typeof e.originalEvent === 'undefined' ) return false;

				e = e.originalEvent;

				if( typeof e.pointerType === 'undefined' ) return false;

				if( typeof e.MSPOINTER_TYPE_MOUSE !== 'undefined' )
				{
					if( e.pointerType != e.MSPOINTER_TYPE_MOUSE ) return true;
				}
				else if( e.pointerType != 'mouse' ) return true;

				return false;
			}
			return ( 'ontouchstart' in window );
		},

		onCSSTransAnimEnd = function( $el, callback )
		{
			var s = document.body || document.documentElement, s = s.style, prefAnim = '', prefTrans = '',
				eAnimEnd  = 'webkitAnimationEnd mozAnimationEnd oAnimationEnd oanimationend animationend',
				eTransEnd = 'webkitTransitionEnd mozTransitionEnd oTransitionEnd otransitionend transitionend';

			if( s.WebkitAnimation == '' )	prefAnim = '-webkit-';
			if( s.MozAnimation == '' )		prefAnim = '-moz-';
			if( s.OAnimation == '' )		prefAnim = '-o-';

			if( s.WebkitTransition == '' )	prefTrans = '-webkit-';
			if( s.MozTransition == '' )		prefTrans = '-moz-';
			if( s.OTransition == '' )		prefTrans = '-o-';

			var animDuration  = $el.css( prefAnim + 'animation-duration' ),
				transDuration = $el.css( prefTrans + 'transition-duration' );

			if( animDuration != undefined && animDuration != '0s' )
			{
				$el.on( eAnimEnd, function()
				{
					$el.off( eAnimEnd );
					callback();
				});
			}
			else if( transDuration != undefined && transDuration != '0s' )
			{
				$el.on( eTransEnd, function()
				{
					$el.off( eTransEnd );
					callback();
				});
			}
			else callback();
		},

		makeShowEvent = function( eventName )
		{
			if( eventName === false ) return false;
            eventName = eventName.replace( 'mouseenter', 'pointerup MSPointerUp touchend mouseenter' ).split( ' ' );
            //eventName = ( eventName == 'mouseenter' ? ( 'pointerup MSPointerUp touchend mouseenter' ) : eventName ).split( ' ' ),
			$.each( eventName, function( i, val )
			{
				if( val != '' ) eventName[ i ] = val + '.tooltippp';
			});
			return eventName.join( ' ' );
		},
		makeHideEvent = function( eventName )
		{
            eventName = eventName.replace( 'mouseleave', 'pointerup MSPointerUp touchend mouseleave' ).split( ' ' );
			//eventName = eventName.split( ' ' ),
			$.each( eventName, function( i, val )
			{
				if( val != '' ) eventName[ i ] = val + '.tooltipppEventHide';
			});
			return eventName.join( ' ' );
		};


	$.fn.tooltippp = function( options )
	{
		var $this = $( this ),
			args  = Array.prototype.slice.call( arguments, 1 );


		if( options === 'option' ) // set/get option
		{
			if( typeof args[ 0 ] !== 'undefined' ) // set/get single
			{
				if( typeof args[ 1 ] !== 'undefined' ) // set
				{
					$this.each( function()
					{
						var $entry		= $( this ),
							newOptions	= $.extend( {}, $entry.data( 'tooltipppOptions' )),
							eventName;

						newOptions[ args[ 0 ]] = args[ 1 ];
						$entry.data( 'tooltipppOptions', newOptions );

						if( args[ 0 ] == 'eventShow' )
						{
							eventName = $entry.data( 'tooltipppEventShow' );
							if( eventName !== false )
								$entry.off( eventName );

							$entry.trigger( 'tooltipppChangeShowEvent', [ args[ 1 ]]);
						}
						else if( args[ 0 ] == 'eventHide' )
						{
							eventName = $this.data( 'tooltipppOptions' )[ 'eventHide' ];
							if( eventName !== false )
								$entry.off( makeHideEvent( eventName ));
						}
						else if( args[ 0 ] == 'showTimeout' )
						{
							$entry.tooltippp( 'option', 'eventShow', newOptions[ 'eventShow' ]);
						}
					});
				}
				else // get
					return $this.data( 'tooltipppOptions' )[ args[ 0 ]];
			}
			else
				return $this.data( 'tooltipppOptions' );

			return this;
		}

		if( options === 'show' ) // show tooltip
		{
			$this.trigger( 'tooltipppDoShow' );
			return this;
		}

		if( options === 'hide' ) // hide tooltip
		{
			$this.trigger( 'tooltipppDoHide' );
			return this;
		}

		if( options === 'refreshContent' ) // refresh tooltip content
		{
			$this.trigger( 'tooltipppRefreshContent' );
			return this;
		}

		if( options === 'repos' ) // reposition tooltip
		{
			$this.trigger( 'tooltipppRepos' );
			return this;
		}

		if( options === 'destroy' ) // destroy plugin
		{
			$this.each( function()
			{
				var $entry = $( this );
				$entry.trigger( 'tooltipppDoHide' );
				$entry.off( '.tooltippp .tooltipppEventHide .tooltipppHideTimeout .tooltipppShowTimeout' );

			});
			return this;
		}


		options = $.extend(
					{
						enabled:			true,
						eventShow:			'mouseenter',
						eventHide:			'mouseleave',
						contentAttr:		'title',
						contentCustom:		false,
						posY:				'top',
						posX:				'center',
						posAuto:			true,
						reposOnResize:		true,
						gapBetween: 		10,				// gap between target and tooltip
						gapViewport:		10,				// min gap between tooltip and viewport
						hideOnSelfClick:	false,
						hideOnDocClick:		false,
						hideOnEscPress:		false,
						showTimeout:		0,
						hideTimeout:		0,				// on mouseenter event
						cssClassName:		'tooltippp',
						cssShowClass:		false,
						cssHideClass:		false,
						onBeforeShow:		false,
						onShow:				false,
						onHide:				false,
						pointer:			true,
						pointerCssClass:	'tooltippp-pointer',
						pointerContent:		'',
						enableTouch:		true,
						zone:				'body'
					},
					options );


		$this.each( function()
		{
			var $target		= $( this ),
				$tooltip	= false,
				$pointer	= false,
				$zone		= false,
				showTO		= false,
				titleAttr	= false,

				getOption = function( key )
				{
					return $target.data( 'tooltipppOptions' )[ key ];
				},

				getTooltipContent = function()
				{
					if( getOption( 'contentCustom' ) !== false )
						return getOption( 'contentCustom' );
					else if( getOption( 'contentAttr' ) !== false )
						return $target.attr( getOption( 'contentAttr' ));
					return '';
				},

				setTooltipPos = function()
				{
					var	winWidth			= $window.width(),
						winHeight			= $window.height(),
						winScrollTop		= $window.scrollTop(),
						winScrollLeft		= $window.scrollLeft(),
						optionPosX 			= getOption( 'posX' ),
						optionPosY 			= getOption( 'posY' ),
						optionGapViewport	= getOption( 'gapViewport' ),
						optionGapBetween	= getOption( 'gapBetween' ),
						isZone				= getOption( 'zone' ) != 'body' && $zone.css( 'position' ) != 'static',
						tooltipResetWidth	= function()
						{
							$tooltip.css( 'width', 'auto' );
							tooltipWidth = $tooltip.outerWidth();
							$tooltip.css( 'width', tooltipWidth + 1 );
						};


					if( isZone )
					{
						winWidth		= $zone.outerWidth() - parseInt( $zone.css( 'border-left-width' )) - parseInt( $zone.css( 'border-right-width' ));
						winHeight		= $zone.outerHeight() - parseInt( $zone.css( 'border-top-width' )) - parseInt( $zone.css( 'border-bottom-width' ));
						winScrollTop	= $zone.scrollTop();
						winScrollLeft	= $zone.scrollLeft();
					}


					// horizontal position

					var targetWidth		= $target.outerWidth(),
						targetOffLeft	= $target.offset().left,
						tooltipWidth	= 0,
						tooltipPosLeft	= 0;

					if( isZone )
						targetOffLeft = targetOffLeft - $zone.offset().left + winScrollLeft - parseInt( $zone.css( 'border-left-width' ));

					var tooltipDoPosCenter = function()
					{
						tooltipResetWidth();
						tooltipPosLeft = targetOffLeft + targetWidth/2 - tooltipWidth/2; // tooltip horizontally centered

						if( tooltipPosLeft - optionGapViewport < winScrollLeft || tooltipPosLeft + tooltipWidth + optionGapViewport > winWidth + winScrollLeft ) // tooltip comes out of the left or right edge
						{
							if( tooltipPosLeft - optionGapViewport < winScrollLeft ) // tooltip comes out of the left
							{
								tooltipPosLeft += winScrollLeft - ( tooltipPosLeft - optionGapViewport );
								tooltipPosLeft  = tooltipPosLeft > targetOffLeft ? targetOffLeft : tooltipPosLeft; // tooltip's left edge cannot pass target's left edge
								if( tooltipPosLeft + tooltipWidth + optionGapViewport > winWidth + winScrollLeft ) // tooltip comes out of the right
								{
									$tooltip.css( 'width', tooltipWidth - ( ( tooltipPosLeft + tooltipWidth + optionGapViewport ) - ( winWidth + winScrollLeft ))); // resizing tooltip to fit viewport
									tooltipWidth = $tooltip.outerWidth();
								}
							}
							else // tooltip comes out of the right
							{
								tooltipPosLeft -= ( tooltipPosLeft + tooltipWidth + optionGapViewport ) - ( winWidth + winScrollLeft );
								tooltipPosLeft  = targetOffLeft + targetWidth > tooltipPosLeft + tooltipWidth ? targetOffLeft + targetWidth - tooltipWidth : tooltipPosLeft; // tooltip's right edge cannot pass target's right edge
								if( tooltipPosLeft - optionGapViewport < winScrollLeft ) // tooltip comes out of the left
								{
									$tooltip.css( 'width', tooltipWidth - ( winScrollLeft - ( tooltipPosLeft - optionGapViewport ))); // resizing tooltip to fit viewport
									tooltipWidth	= $tooltip.outerWidth();
									tooltipPosLeft += winScrollLeft - ( tooltipPosLeft - optionGapViewport );
								}
							}
						}
					};

					if( getOption( 'posX' ) == 'center' ) tooltipDoPosCenter();
					else // left or right
					{
						var tooltipDoPosOnLeft = function()
						{
							tooltipResetWidth();
							if( tooltipWidth + optionGapViewport > targetOffLeft - winScrollLeft ) // tooltip is wider than space on left side
							{
								$tooltip.css( 'width', targetOffLeft - winScrollLeft - optionGapViewport - optionGapBetween ); // resizing tooltip to fit the left space
								tooltipWidth   = $tooltip.outerWidth();
								tooltipPosLeft = winScrollLeft + optionGapViewport;
								if( tooltipWidth + optionGapViewport + optionGapBetween > targetOffLeft - winScrollLeft ) // tooltip cannot be more narrow and is wider than space on left side
									return false;
							}
							else tooltipPosLeft = targetOffLeft - tooltipWidth - optionGapBetween;
							return true;
						},
						tooltipDoPosOnRight = function()
						{
							tooltipResetWidth();
							tooltipPosLeft = targetOffLeft + targetWidth + optionGapBetween;
							if( tooltipWidth > winWidth - ( tooltipPosLeft - winScrollLeft )) // tooltip is wider than space on right side
							{
								$tooltip.css( 'width',  Math.floor( winWidth - ( tooltipPosLeft - winScrollLeft ) - optionGapBetween ));
								tooltipWidth = $tooltip.outerWidth();
								if( tooltipWidth + optionGapViewport + optionGapBetween > Math.floor( winWidth + winScrollLeft - targetOffLeft - targetWidth )) // tooltip cannot be more narrow and is wider than space on left side
									return false;
							}
							return true;
						};
						if( getOption( 'posX' ) == 'right' )
						{
							if( !tooltipDoPosOnRight() && getOption( 'posAuto' ))
							{
								optionPosX = 'left';
								if( !tooltipDoPosOnLeft())
								{
									optionPosX = 'center';
									optionPosY = 'top';
									tooltipDoPosCenter();
								}
							}
						}
						else // left
						{
							if( !tooltipDoPosOnLeft() && getOption( 'posAuto' ))
							{
								optionPosX = 'right';
								if( !tooltipDoPosOnRight())
								{
									optionPosX = 'center';
									optionPosY = 'top';
									tooltipDoPosCenter();
								}
							}
						}
					}


					// vetical position

					var targetOffTop = $target.offset().top;

					if( isZone )
						targetOffTop = targetOffTop - $zone.offset().top + winScrollTop - parseInt( $zone.css( 'border-top-width' ));

					var targetHeight		= $target.outerHeight(),
						tooltipHeight		= $tooltip.outerHeight(),
						tooltipPosAbove		= targetOffTop - tooltipHeight - optionGapBetween,
						tooltipPosBelow		= targetOffTop + targetHeight + optionGapBetween,
						tooltipPosTop		= targetOffTop + ( targetHeight/2 ) - ( tooltipHeight/2 ), // center
						pointerPosTop		= 0,
						pointerPosLeft		= 0;

					if( optionPosX == 'center' )
					{
						var tooltipCanPosAbove	= winScrollTop < targetOffTop - tooltipHeight - optionGapBetween,
							tooltipCanPosBelow	= winHeight - ( targetOffTop + targetHeight - winScrollTop ) > tooltipHeight + optionGapBetween;

						if( optionPosY == 'top' )
							tooltipPosTop = tooltipCanPosAbove ? tooltipPosAbove : ( getOption( 'posAuto' ) ? tooltipPosBelow : tooltipPosAbove );
						else if( optionPosY == 'bottom' )
							tooltipPosTop = tooltipCanPosBelow ? tooltipPosBelow : ( getOption( 'posAuto' ) ? tooltipPosAbove : tooltipPosBelow );

						if( $pointer )
						{
							if( tooltipPosTop == tooltipPosAbove )
							{
								$pointer.attr( 'data-direction', 'south' );
								pointerPosTop = tooltipHeight;
							}
							else if( tooltipPosTop == tooltipPosBelow )
							{
								$pointer.attr( 'data-direction', 'north' );
								pointerPosTop = -$pointer.outerHeight();
							}
							pointerPosLeft = targetOffLeft + targetWidth/2 - $pointer.outerWidth()/2 - tooltipPosLeft;
						}
					}
					else
					{
						if( optionPosY == 'top' )
							tooltipPosTop = targetOffTop;
						else if( optionPosY == 'bottom' )
							tooltipPosTop = targetOffTop + targetHeight - tooltipHeight;

						if( $pointer )
						{
							if( optionPosX == 'left' )
							{
								$pointer.attr( 'data-direction', 'east' );
								pointerPosLeft = tooltipWidth;
							}
							else // right
							{
								$pointer.attr( 'data-direction', 'west' );
								pointerPosLeft = -$pointer.outerWidth();
							}
							pointerPosTop = targetOffTop + targetHeight/2 - $pointer.outerHeight()/2 - tooltipPosTop;
						}
					}

					$tooltip.css({ top: tooltipPosTop, left: tooltipPosLeft });
					if( $pointer )
						$pointer.css({ top: pointerPosTop, left: pointerPosLeft });
				},

				addTooltip = function( e )
				{
					if( !getOption( 'enabled' ))
						return true;

					var touchSupport = getOption( 'eventShow' ) == 'mouseenter';

					if( touchSupport && wasTouched( e ) && e.type == 'mouseenter' ) // prevent multiple event calls when touch is supported
						return true;

					if( wasTouched( e ) && !getOption( 'enableTouch' ))
						return true;

					if( $tooltip )
					{
						if( touchSupport && wasTouched( e )) removeTooltip(); // hide tooltip if the target was touched the for the second time
						return true;
					}


					var zone = getOption( 'zone' );
					$zone = typeof zone === 'string' ? $( zone ) : zone;

					$tooltip = $( '<div></div>' ).addClass( getOption( 'cssClassName' )).css( 'position', 'absolute' ).html( getTooltipContent()).appendTo( $zone );

					if( getOption( 'cssShowClass' ))
						$tooltip.addClass( getOption( 'cssShowClass' ));

					if( getOption( 'pointer' ))
						$pointer = $( '<div></div>' ).addClass( getOption( 'pointerCssClass' )).css( 'position', 'absolute' ).html( getOption( 'pointerContent' )).appendTo( $tooltip );

					var targetAttrTitle = $target.attr( 'title' );
					if( typeof targetAttrTitle !== 'undefined' )
						$target.data( 'tooltipppRealTitle', targetAttrTitle ).removeAttr( 'title' );

					if( getOption( 'eventHide' ))
					{
                        setTimeout(function() // prevents removeTooltip() firing right after addTooltip()
                        {
    						var targetEventHide = makeHideEvent( getOption( 'eventHide' ));
    						$target.on( targetEventHide, function(e)
    						{
    							$target.off( targetEventHide );
    							removeTooltip();
    						});
                        }, 10);
					}

					if( touchSupport && wasTouched( e ))
						$tooltip.data( 'touchSupport', true );

					if( getOption( 'hideOnSelfClick' ))
						$tooltip.on( 'click', function(){ $tooltip.data( 'preventHide', false ); removeTooltip(); });

					if( getOption( 'hideTimeout' ) && !wasTouched( e ))
					{
						$target.add( $tooltip ).on( 'mouseenter.tooltipppHideTimeout', function()
						{
							$tooltip.data( 'preventHide', true );
						})
						.on( 'mouseleave.tooltipppHideTimeout', function()
						{
							$tooltip.data( 'preventHide', false );
							removeTooltip();
						});
					}

					var onBeforeShowFn = getOption( 'onBeforeShow' );
					if( typeof onBeforeShowFn === 'function' )
						onBeforeShowFn( $target, $tooltip );

					setTooltipPos();

					var onShowFn = getOption( 'onShow' );
					if( typeof onShowFn === 'function' )
						onShowFn( $target, $tooltip );
				},

				removeTooltip = function()
				{
					if( !$tooltip ) return true;
					setTimeout( function()
					{
						if( $tooltip && $tooltip.data( 'preventHide' ) !== true )
						{
							var doIT = function()
							{
								if( !$tooltip ) return true;

								$tooltip.remove();
								$tooltip	= false;
								$zone		= false;
								showTO		= false;
								titleAttr	= false;

								if( $pointer )
								{
									$pointer.remove();
									$pointer = false;
								}

								$target.off( 'mouseenter.tooltipppHideTimeout mouseleave.tooltipppHideTimeout' );

								var onHideFn = getOption( 'onHide' );
								if( typeof onHideFn === 'function' )
									onHideFn( $target );

								var targetAttrTitle = $target.data( 'tooltipppRealTitle' );
								if( typeof targetAttrTitle !== 'undefined' )
									$target.attr( 'title', targetAttrTitle );

								if( getOption( 'eventHide' ))
									$target.off( makeHideEvent( getOption( 'eventHide' )));
							};
							if( getOption( 'cssHideClass' )  )
							{
								if( getOption( 'cssShowClass' )) $tooltip.removeClass( getOption( 'cssShowClass' ));
								$tooltip.addClass( getOption( 'cssHideClass' ));
								onCSSTransAnimEnd( $tooltip, doIT );
							}
							else doIT();
						}
					}, $tooltip.data( 'touchSupport' ) === true ? 0 : getOption( 'hideTimeout' )); // no hideTimeout for touch
				},

				bindShowEvent = function( eventShow )
				{
					var showTimeout = getOption( 'showTimeout' );
					if( showTimeout )
					{
						$target.on( eventShow, function( e )
						{
                            // TODO: make this fire only once when eventShow hosts multiple event types
							titleAttr	= $target.attr( 'title' );
							showTO		= setTimeout( function()
							{
								if( typeof titleAttr !== 'undefined' ) $target.attr( 'title', titleAttr );
								addTooltip( e );
							},
							showTimeout );
							$target.removeAttr( 'title' ).one( 'mouseleave.tooltipppShowTimeout', function()
							{
								if( typeof titleAttr !== 'undefined' ) $target.attr( 'title', titleAttr );
								if( showTO ) clearTimeout( showTO );
							});
						});
					}
					else $target.on( eventShow, addTooltip );
				};


			var targetOptions = $target.attr( 'data-tooltippp' );
			targetOptions = typeof targetOptions !== 'undefined' ? $.extend( {}, options, $.parseJSON( targetOptions )) : options;
			$target.data( 'tooltipppOptions', targetOptions );

			var eventShow = makeShowEvent( getOption( 'eventShow' ));
			$target.data( 'tooltipppEventShow', eventShow );

			if( eventShow !== false )
				bindShowEvent( eventShow );

			$target.on( 'tooltipppChangeShowEvent.tooltippp', function( e, eventName )
			{
				eventShow = makeShowEvent( eventName );
				$target.data( 'tooltipppEventShow', eventShow );
				if( eventShow !== false )
					bindShowEvent( eventShow );
			})
			.on( 'tooltipppDoShow.tooltippp', function()
			{
				addTooltip( undefined );
			})
			.on( 'tooltipppDoHide.tooltippp', function()
			{
				removeTooltip();
			})
			.on( 'tooltipppRepos.tooltippp', function()
			{
				if( !$tooltip ) return true;
				setTooltipPos();
			})
			.on( 'tooltipppRefreshContent.tooltippp', function()
			{
				if( !$tooltip ) return true;
				$tooltip.html( getTooltipContent());
			});


			$document.on( 'click touchend', function( e ) // TODO: check why iOS is not firing "click"
			{
				if( !$tooltip ) return true;
				if( getOption( 'hideOnDocClick' ) || $tooltip.data( 'touchSupport' ) === true && wasTouched( e ))
				{
					var $clickedElem = $( e.target ),
						isTarget	 = false;

					if( $clickedElem.is( $target ) || $clickedElem.is( $tooltip ))
						return true;

					$( e.target ).parents().each( function()
					{
						$clickedElem = $( this );
						if( $clickedElem.is( $target ) || $clickedElem.is( $tooltip ))
						{
							isTarget = true;
							return false;
						}
					});

					if( !isTarget )
						removeTooltip();
				}
			})
			.on( 'keyup', function( e )
			{
				if( !$tooltip ) return true;
				if( getOption( 'hideOnEscPress' ))
					if( e.keyCode == 27 /* esc */ )
						removeTooltip();
			});


			$window.on( 'resize', throttle( 250, function()
			{
				if( !$tooltip ) return true;
				if( getOption( 'reposOnResize' ))
					setTooltipPos();
			}));
		});

		return this;
	};
})( jQuery, window, document );
