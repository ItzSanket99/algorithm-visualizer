/*
 * =========================================================
 * ALGO TRACE PLAYBACK
 * =========================================================
 *
 * Creates ONE playback state per CALL.
 *
 * The playback order is POST-ORDER:
 *
 *       fib(4)
 *       /    \
 *    fib(3) fib(2)
 *
 * becomes:
 *
 * fib(1)
 * fib(0)
 * fib(2)
 * fib(1)
 * fib(3)
 * fib(1)
 * fib(0)
 * fib(2)
 * fib(4)
 * main
 *
 * This gives the user the natural recursive
 * "go down -> return -> go back to parent"
 * experience.
 */


/*
 * Find the METHOD_EXIT event belonging to a call.
 */
function findExitEvent(events, callId) {
    return events.find(
        event =>
            event.callId === callId &&
            event.eventType === "METHOD_EXIT"
    ) || null;
}


/*
 * Find the most useful LINE_EXECUTED event
 * for a call.
 *
 * We prefer the LAST line executed because it
 * usually contains the final local variable state.
 */
function findLastLineEvent(events, callId) {
    const callEvents = events.filter(
        event =>
            event.callId === callId &&
            event.eventType === "LINE_EXECUTED"
    );

    if (callEvents.length === 0) {
        return null;
    }

    return callEvents[callEvents.length - 1];
}


/*
 * Build a single playback state for a call.
 *
 * This combines:
 *
 * - method parameters
 * - final variables
 * - return value
 * - call information
 *
 * into ONE useful state.
 */
function createCallState(call, events) {

    const exitEvent =
        findExitEvent(events, call.callId);

    const lastLineEvent =
        findLastLineEvent(events, call.callId);

    return {
        callId: call.callId,

        methodName: call.methodName,

        callDepth: call.callDepth,

        parentCallId: call.parentCallId,

        parameters:
            exitEvent?.parameters ||
            call.parameters ||
            {},

        variables:
            lastLineEvent?.variables ||
            {},

        returnValue:
            exitEvent?.returnValue ??
            call.returnValue ??
            null,

        lineNumber:
            exitEvent?.lineNumber ??
            lastLineEvent?.lineNumber ??
            call.lineNumber ??
            null,

        eventType:
            exitEvent?.eventType ||
            "METHOD_EXIT",

        event: exitEvent || lastLineEvent
    };
}


/*
 * Convert the call tree into a POST-ORDER list.
 *
 * Children are processed FIRST.
 *
 * Parent is processed AFTER children.
 */
function buildPostOrder(node, events, result) {

    if (!node) {
        return;
    }

    const children =
        node.children || [];

    /*
     * First visit all children.
     */
    for (const child of children) {
        buildPostOrder(
            child,
            events,
            result
        );
    }

    /*
     * Then visit the current node.
     */
    result.push(
        createCallState(
            node,
            events
        )
    );
}


/*
 * Main public function.
 */
export function buildPlayback(execution) {

    if (!execution) {
        return [];
    }

    const events =
        execution.events || [];

    const root =
        execution.callTree;

    if (!root) {
        return [];
    }

    const playback = [];

    /*
     * Process algorithm tree first.
     *
     * main() is handled separately at the end.
     */
    const algorithmChildren =
        root.children || [];

    if (
        root.methodName === "main" &&
        algorithmChildren.length > 0
    ) {

        /*
         * Process every algorithm call
         * in recursive post-order.
         */
        for (const child of algorithmChildren) {

            buildPostOrder(
                child,
                events,
                playback
            );
        }

        /*
         * Finally process main().
         *
         * This gives:
         *
         * fib(...)
         * ...
         * fib(4)
         * main()
         */
        playback.push(
            createCallState(
                root,
                events
            )
        );

    } else {

        /*
         * Fallback if root isn't main.
         */
        buildPostOrder(
            root,
            events,
            playback
        );
    }

    return playback;
}


/*
 * Optional helper.
 */
export function getPlaybackState(
    playback,
    index
) {

    if (
        !playback ||
        playback.length === 0 ||
        index < 0 ||
        index >= playback.length
    ) {
        return null;
    }

    return playback[index];
}