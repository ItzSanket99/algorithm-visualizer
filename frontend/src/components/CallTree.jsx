import React, {
    useMemo,
    useRef,
    useState,
} from "react";


/*
 * =========================================================
 * AlgoTrace Call / Recursion Tree
 * =========================================================
 *
 * Existing implementation preserved:
 *
 * - Same tree layout algorithm
 * - Same node information
 * - Same active-call highlighting
 * - Same backend tree structure support
 * - Same App.jsx props
 * - No execution-engine changes
 * - No external tree library
 *
 * Existing features:
 *
 * - Tree statistics
 * - Node selection support
 */


/* =========================================================
   TREE DIMENSIONS
   ========================================================= */

const NODE_WIDTH = 104;
const NODE_HEIGHT = 76;

const HORIZONTAL_GAP = 18;
const VERTICAL_GAP = 30;

const SIDE_PADDING = 32;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 32;


/* =========================================================
   HELPERS
   ========================================================= */

function getChildren(node) {

    if (!node) {
        return [];
    }


    if (Array.isArray(node.children)) {
        return node.children;
    }


    if (Array.isArray(node.childNodes)) {
        return node.childNodes;
    }


    if (Array.isArray(node.calls)) {
        return node.calls;
    }


    return [];
}


function getMethodName(node) {

    return (
        node?.methodName ??
        node?.method ??
        node?.name ??
        "unknown"
    );
}


function getCallId(node) {

    return (
        node?.callId ??
        node?.id ??
        null
    );
}


function getParameters(node) {

    return (
        node?.parameters ??
        node?.params ??
        {}
    );
}


function getReturnValue(node) {

    if (
        node?.returnValue !== undefined &&
        node?.returnValue !== null
    ) {

        return String(
            node.returnValue
        );
    }


    if (
        node?.returnValueFormatted !== undefined &&
        node?.returnValueFormatted !== null
    ) {

        return String(
            node.returnValueFormatted
        );
    }


    return null;
}


function formatValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "null";
    }


    const text =
        String(value);


    if (text.length > 20) {

        return (
            text.substring(
                0,
                17
            ) + "..."
        );
    }


    return text;
}


function getParameterText(node) {

    const parameters =
        getParameters(node);


    if (
        !parameters ||
        typeof parameters !== "object"
    ) {

        return "";
    }


    const entries =
        Object.entries(
            parameters
        );


    if (entries.length === 0) {

        return "";
    }


    /*
     * Most recursion methods:
     *
     * n = 4
     *
     * Keep this compact.
     */

    if (entries.length === 1) {

        const [
            name,
            value
        ] = entries[0];


        return (
            `${name}=${formatValue(value)}`
        );
    }


    return entries
        .map(
            ([name, value]) =>
                `${name}=${formatValue(value)}`
        )
        .join(", ");
}


/* =========================================================
   TREE STATISTICS
   ========================================================= */

function getTreeStatistics(root) {

    if (!root) {

        return {
            nodeCount: 0,
            maxDepth: 0,
        };
    }


    let nodeCount = 0;
    let maxDepth = 0;


    function visit(
        node,
        depth
    ) {

        if (!node) {
            return;
        }


        nodeCount++;


        maxDepth =
            Math.max(
                maxDepth,
                depth
            );


        const children =
            getChildren(node);


        for (
            const child
            of children
        ) {

            visit(
                child,
                depth + 1
            );
        }
    }


    visit(
        root,
        0
    );


    return {
        nodeCount,
        maxDepth,
    };
}


/* =========================================================
   TREE LAYOUT
   ========================================================= */

/*
 * Each leaf receives a horizontal slot.
 *
 * Parents are centered above their children.
 *
 * This is the SAME layout strategy as the
 * previous implementation.
 */

function calculateLayout(root) {

    if (!root) {

        return {

            nodes: [],

            edges: [],

            width: 0,

            height: 0,

            nodeMap: new Map(),

            nodeCount: 0,

            maxDepth: 0,
        };
    }


    const nodes = [];
    const edges = [];

    const nodeMap =
        new Map();


    let leafIndex = 0;
    let maxDepth = 0;


    function visit(
        node,
        depth,
        parent = null
    ) {

        if (!node) {
            return null;
        }


        maxDepth =
            Math.max(
                maxDepth,
                depth
            );


        const children =
            getChildren(node);


        const childLayouts = [];


        for (
            const child
            of children
        ) {

            const childLayout =
                visit(
                    child,
                    depth + 1,
                    node
                );


            if (childLayout) {

                childLayouts.push(
                    childLayout
                );
            }
        }


        let centerX;


        /*
         * Leaf node.
         */

        if (
            childLayouts.length === 0
        ) {

            centerX =
                SIDE_PADDING +
                leafIndex *
                    (
                        NODE_WIDTH +
                        HORIZONTAL_GAP
                    ) +
                NODE_WIDTH / 2;


            leafIndex++;
        }


        /*
         * Parent node.
         */

        else {

            const first =
                childLayouts[0];


            const last =
                childLayouts[
                    childLayouts.length - 1
                ];


            centerX =
                (
                    first.centerX +
                    last.centerX
                ) / 2;
        }


        const y =
            TOP_PADDING +
            depth *
                (
                    NODE_HEIGHT +
                    VERTICAL_GAP
                );


        const layout = {

            node,

            centerX,

            y,

            depth,
        };


        nodes.push(
            layout
        );


        nodeMap.set(
            node,
            layout
        );


        if (parent) {

            edges.push({

                parent,

                child: node,
            });
        }


        return layout;
    }


    visit(
        root,
        0
    );


    const leafCount =
        Math.max(
            1,
            leafIndex
        );


    const width =
        SIDE_PADDING * 2 +
        leafCount *
            NODE_WIDTH +
        Math.max(
            0,
            leafCount - 1
        ) *
            HORIZONTAL_GAP;


    const height =
        TOP_PADDING +
        (
            maxDepth + 1
        ) *
            NODE_HEIGHT +
        maxDepth *
            VERTICAL_GAP +
        BOTTOM_PADDING;


    return {

        nodes,

        edges,

        width,

        height,

        nodeMap,

        nodeCount:
            nodes.length,

        maxDepth,
    };
}


/* =========================================================
   TREE NODE
   ========================================================= */

function TreeNode({

    node,

    centerX,

    y,

    activeCallId,

    onSelect,

}) {

    const callId =
        getCallId(node);


    const isActive =
        activeCallId !== null &&
        activeCallId !== undefined &&
        String(callId) ===
            String(activeCallId);


    const methodName =
        getMethodName(node);


    const parameterText =
        getParameterText(node);


    const returnValue =
        getReturnValue(node);


    const left =
        centerX -
        NODE_WIDTH / 2;


    function handleClick(
        event
    ) {

        /*
         * Prevent tree dragging
         * when selecting a node.
         */

        event.stopPropagation();


        if (onSelect) {

            onSelect(node);
        }
    }


    function handlePointerDown(
        event
    ) {

        /*
         * Prevent the viewport from
         * interpreting node selection
         * as a drag.
         */

        event.stopPropagation();
    }


    return (

        <div

            data-tree-node="true"

            onClick={
                handleClick
            }

            onPointerDown={
                handlePointerDown
            }

            title={
                parameterText
                    ? `${methodName}(${parameterText})`
                    : methodName
            }

            className={[
                "absolute",

                "cursor-pointer",

                "rounded-lg",

                "border",

                "transition-all",

                "duration-200",

                "select-none",

                "overflow-hidden",

                "hover:border-blue-400/70",

                "hover:brightness-110",

                isActive

                    ? [
                          "border-blue-400",

                          "bg-blue-950/70",

                          "shadow-[0_0_18px_rgba(59,130,246,0.30)]",

                          "scale-[1.03]",
                      ].join(" ")

                    : [
                          "border-slate-700",

                          "bg-slate-800/95",

                          "shadow-sm",
                      ].join(" "),
            ].join(" ")}

            style={{
                width:
                    `${NODE_WIDTH}px`,

                height:
                    `${NODE_HEIGHT}px`,

                left:
                    `${left}px`,

                top:
                    `${y}px`,
            }}
        >

            {/* =================================================
               METHOD
            ================================================= */}

            <div
                className={[
                    "px-2",

                    "pt-2",

                    "text-center",

                    "font-mono",

                    "text-sm",

                    "font-bold",

                    "leading-tight",

                    "truncate",

                    isActive
                        ? "text-blue-200"
                        : "text-slate-100",
                ].join(" ")}
            >

                {methodName}

            </div>


            {/* =================================================
               PARAMETERS
            ================================================= */}

            {parameterText && (

                <div
                    className={[
                        "mt-1",

                        "truncate",

                        "px-1",

                        "text-center",

                        "font-mono",

                        "text-[10px]",

                        isActive
                            ? "text-blue-300"
                            : "text-slate-400",
                    ].join(" ")}

                    title={
                        parameterText
                    }
                >

                    {parameterText}

                </div>
            )}


            {/* =================================================
               CALL ID
            ================================================= */}

            {
                callId !== null &&
                callId !== undefined && (

                    <div
                        className={[
                            "mt-0.5",

                            "text-center",

                            "font-mono",

                            "text-[9px]",

                            isActive
                                ? "text-blue-300/70"
                                : "text-slate-500",
                        ].join(" ")}
                    >

                        call #{callId}

                    </div>
                )
            }


            {/* =================================================
               RETURN VALUE
            ================================================= */}

            {returnValue !== null && (

                <div
                    className={[
                        "absolute",

                        "bottom-1.5",

                        "left-0",

                        "right-0",

                        "text-center",

                        "font-mono",

                        "text-[10px]",

                        "font-semibold",

                        returnValue === "void"

                            ? "text-slate-500"

                            : "text-green-400",
                    ].join(" ")}
                >

                    →{" "}

                    {
                        formatValue(
                            returnValue
                        )
                    }

                </div>
            )}

        </div>
    );
}


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function CallTree({

    callTree,

    tree,

    root,

    activeCallId,

    selectedCallId,

    onSelect,

}) {

    /*
     * -------------------------------------------------------
     * Support existing App.jsx props.
     * -------------------------------------------------------
     */

    const treeRoot =
        callTree ??
        tree ??
        root ??
        null;


    /*
     * Some backend versions may wrap
     * the tree inside { root: ... }.
     */

    const actualRoot =
        treeRoot?.root ??
        treeRoot;


    /*
     * Existing activeCallId behaviour.
     */

    const effectiveActiveCallId =
        activeCallId ??
        selectedCallId ??
        null;


    /* =====================================================
       LAYOUT
       ===================================================== */

    const layout =
        useMemo(
            () =>
                calculateLayout(
                    actualRoot
                ),
            [actualRoot]
        );


    /* =====================================================
       TREE STATISTICS
       ===================================================== */

    const statistics =
        useMemo(
            () =>
                getTreeStatistics(
                    actualRoot
                ),
            [actualRoot]
        );


    /* =====================================================
       VIEWPORT
       ===================================================== */

    const viewportRef =
        useRef(null);


    /* =====================================================
       EMPTY STATE
       ===================================================== */

    if (!actualRoot) {

        return (

            <div
                className="
                    flex
                    h-full
                    min-h-[300px]
                    items-center
                    justify-center
                    rounded-lg
                    bg-slate-950/40
                "
            >

                <div
                    className="
                        text-center
                    "
                >

                    <p
                        className="
                            text-sm
                            font-medium
                            text-slate-400
                        "
                    >
                        No execution tree available.
                    </p>


                    <p
                        className="
                            mt-1
                            text-xs
                            text-slate-600
                        "
                    >
                        Run recursive code to see
                        the execution tree.
                    </p>

                </div>

            </div>
        );
    }


    /* =====================================================
       MAIN TREE VIEW
       ===================================================== */

    return (

        <div
            ref={
                viewportRef
            }

            className="
                relative
                h-full
                min-h-[420px]
                w-full
                overflow-auto
                rounded-lg
                bg-slate-950/40
            "
        >

            {/* =================================================
                TREE CANVAS
            ================================================= */}

            <div
                className="
                    relative
                "

                style={{

                    width:
                        `${layout.width}px`,

                    height:
                        `${layout.height}px`,
                }}
            >

                {/* =============================================
                    CONNECTOR LINES
                ============================================= */}

                <svg
                    className="
                        pointer-events-none
                        absolute
                        inset-0
                        overflow-visible
                    "

                    width={
                        layout.width
                    }

                    height={
                        layout.height
                    }

                    viewBox={
                        `0 0 ${layout.width} ${layout.height}`
                    }
                >

                    {
                        layout.edges.map(
                            (
                                edge,
                                index
                            ) => {

                                const parentLayout =
                                    layout.nodeMap.get(
                                        edge.parent
                                    );


                                const childLayout =
                                    layout.nodeMap.get(
                                        edge.child
                                    );


                                if (
                                    !parentLayout ||
                                    !childLayout
                                ) {

                                    return null;
                                }


                                const x1 =
                                    parentLayout.centerX;


                                const y1 =
                                    parentLayout.y +
                                    NODE_HEIGHT;


                                const x2 =
                                    childLayout.centerX;


                                const y2 =
                                    childLayout.y;


                                const middleY =
                                    y1 +
                                    (
                                        y2 -
                                        y1
                                    ) / 2;


                                const parentId =
                                    getCallId(
                                        edge.parent
                                    );


                                const childId =
                                    getCallId(
                                        edge.child
                                    );


                                const edgeActive =
                                    effectiveActiveCallId !==
                                        null &&

                                    (
                                        String(
                                            parentId
                                        ) ===
                                            String(
                                                effectiveActiveCallId
                                            ) ||

                                        String(
                                            childId
                                        ) ===
                                            String(
                                                effectiveActiveCallId
                                            )
                                    );


                                return (

                                    <g
                                        key={
                                            `edge-${index}`
                                        }
                                    >

                                        {/* =================================
                                            PARENT VERTICAL
                                        ================================= */}

                                        <line

                                            x1={
                                                x1
                                            }

                                            y1={
                                                y1
                                            }

                                            x2={
                                                x1
                                            }

                                            y2={
                                                middleY
                                            }

                                            stroke={
                                                edgeActive
                                                    ? "#60a5fa"
                                                    : "#334155"
                                            }

                                            strokeWidth={
                                                edgeActive
                                                    ? 1.5
                                                    : 1
                                            }

                                            strokeLinecap="round"
                                        />


                                        {/* =================================
                                            HORIZONTAL
                                        ================================= */}

                                        <line

                                            x1={
                                                x1
                                            }

                                            y1={
                                                middleY
                                            }

                                            x2={
                                                x2
                                            }

                                            y2={
                                                middleY
                                            }

                                            stroke={
                                                edgeActive
                                                    ? "#60a5fa"
                                                    : "#334155"
                                            }

                                            strokeWidth={
                                                edgeActive
                                                    ? 1.5
                                                    : 1
                                            }

                                            strokeLinecap="round"
                                        />


                                        {/* =================================
                                            CHILD VERTICAL
                                        ================================= */}

                                        <line

                                            x1={
                                                x2
                                            }

                                            y1={
                                                middleY
                                            }

                                            x2={
                                                x2
                                            }

                                            y2={
                                                y2
                                            }

                                            stroke={
                                                edgeActive
                                                    ? "#60a5fa"
                                                    : "#334155"
                                            }

                                            strokeWidth={
                                                edgeActive
                                                    ? 1.5
                                                    : 1
                                            }

                                            strokeLinecap="round"
                                        />

                                    </g>
                                );
                            }
                        )
                    }

                </svg>


                {/* =============================================
                    NODES
                ============================================= */}

                {
                    layout.nodes.map(
                        item => (

                            <TreeNode

                                key={
                                    `node-${getCallId(
                                        item.node
                                    )}-${item.depth}-${Math.round(
                                        item.centerX
                                    )}`
                                }

                                node={
                                    item.node
                                }

                                centerX={
                                    item.centerX
                                }

                                y={
                                    item.y
                                }

                                activeCallId={
                                    effectiveActiveCallId
                                }

                                onSelect={
                                    onSelect
                                }

                            />

                        )
                    )
                }

            </div>


        </div>
    );
}