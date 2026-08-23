function formatParameterValue(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const text = String(value);

    // Compact JDI array representation.
    // Example:
    // instance of int[6] (id=40)
    // becomes:
    // int[6]
    const arrayMatch = text.match(
        /instance of ([\w.$]+\[\d*\])/
    );

    if (arrayMatch) {
        return arrayMatch[1];
    }

    // Remove JDI object id.
    return text.replace(
        /\s*\(id=\d+\)/g,
        ""
    );
}


/* =========================================================
   NODE CARD
   ========================================================= */

function NodeCard({ node, onSelect }) {

    if (!node) {
        return null;
    }

    const parameters =
        node.parameters || {};

    const parameterText =
        Object.entries(parameters)
            .map(
                ([key, value]) =>
                    `${key}=${formatParameterValue(value)}`
            )
            .join(", ");

    return (
        <button
            type="button"
            onClick={() => onSelect(node)}
            className="
                min-w-[110px]
                rounded-lg
                border
                border-[#3d4654]
                bg-[#1c232d]
                px-3
                py-2
                text-center
                font-mono
                shadow-[0_3px_10px_rgba(0,0,0,0.25)]
                transition
                duration-150
                hover:-translate-y-0.5
                hover:border-[#6685ff]
                hover:bg-[#252e3a]
            "
        >

            {/* METHOD */}

            <div
                className="
                    text-[13px]
                    font-bold
                    text-[#f0f6fc]
                "
            >
                {node.methodName}
            </div>


            {/* PARAMETERS */}

            {parameterText && (
                <div
                    className="
                        mt-[3px]
                        max-w-[180px]
                        truncate
                        text-[11px]
                        text-[#8b949e]
                    "
                    title={parameterText}
                >
                    {parameterText}
                </div>
            )}


            {/* RETURN VALUE */}

            <div
                className="
                    mt-1
                    text-[12px]
                    font-semibold
                    text-[#56d364]
                "
            >
                → {node.returnValue ?? "—"}
            </div>

        </button>
    );
}


/* =========================================================
   RECURSION TREE
   ========================================================= */

function RecursionTree({
    node,
    onSelect
}) {

    if (!node) {
        return null;
    }

    const children =
        node.children || [];

    /*
     * First child  = left recursive call
     * Second child = right recursive call
     */

    const leftChild =
        children[0] || null;

    const rightChild =
        children[1] || null;


    return (

        <div
            className="
                mx-auto
                flex
                w-max
                min-w-0
                flex-col
                items-center
            "
        >

            {/* =================================================
                CURRENT NODE
               ================================================= */}

            <div
                className="
                    relative
                    z-[2]
                    flex
                    justify-center
                "
            >

                <NodeCard
                    node={node}
                    onSelect={onSelect}
                />

            </div>


            {/* =================================================
                CHILDREN
               ================================================= */}

            {(leftChild || rightChild) && (

                <>

                    {/* =================================================
                        PARENT → CHILDREN CONNECTOR

                        Children layout:

                        130px + 24px + 130px = 284px

                        Child centers:

                        65px
                        219px
                       ================================================= */}

                    <div
                        className="
                            relative
                            h-[30px]
                            w-[284px]
                            shrink-0
                        "
                    >

                        {/* Parent vertical line */}

                        <div
                            className="
                                absolute
                                left-1/2
                                top-0
                                h-[15px]
                                w-px
                                -translate-x-1/2
                                bg-[#59636f]
                            "
                        />

                        {/* Horizontal branch line */}

                        <div
                            className="
                                absolute
                                left-[65px]
                                right-[65px]
                                top-[15px]
                                h-px
                                bg-[#59636f]
                            "
                        />

                    </div>


                    {/* =================================================
                        LEFT + RIGHT CHILDREN
                       ================================================= */}

                    <div
                        className="
                            relative
                            grid
                            w-[284px]
                            grid-cols-[130px_130px]
                            gap-6
                        "
                    >

                        {/* =================================================
                            LEFT CHILD
                           ================================================= */}

                        <div
                            className="
                                relative
                                flex
                                w-[130px]
                                justify-center
                            "
                        >

                            {/* Vertical connector to left node */}

                            {leftChild && (
                                <div
                                    className="
                                        absolute
                                        left-1/2
                                        top-[-15px]
                                        h-[15px]
                                        w-px
                                        -translate-x-1/2
                                        bg-[#59636f]
                                    "
                                />
                            )}

                            {leftChild ? (

                                <RecursionTree
                                    node={leftChild}
                                    onSelect={onSelect}
                                />

                            ) : (

                                <div
                                    className="
                                        h-[35px]
                                        w-[110px]
                                    "
                                />

                            )}

                        </div>


                        {/* =================================================
                            RIGHT CHILD
                           ================================================= */}

                        <div
                            className="
                                relative
                                flex
                                w-[130px]
                                justify-center
                            "
                        >

                            {/* Vertical connector to right node */}

                            {rightChild && (
                                <div
                                    className="
                                        absolute
                                        left-1/2
                                        top-[-15px]
                                        h-[15px]
                                        w-px
                                        -translate-x-1/2
                                        bg-[#59636f]
                                    "
                                />
                            )}

                            {rightChild ? (

                                <RecursionTree
                                    node={rightChild}
                                    onSelect={onSelect}
                                />

                            ) : (

                                <div
                                    className="
                                        h-[35px]
                                        w-[110px]
                                    "
                                />

                            )}

                        </div>

                    </div>

                </>

            )}

        </div>
    );
}


/* =========================================================
   CALL TREE
   ========================================================= */

export default function CallTree({
    root,
    onSelect
}) {

    if (!root) {

        return (
            <div
                className="
                    flex
                    h-full
                    items-center
                    justify-center
                    text-[13px]
                    text-[#6e7681]
                "
            >
                No execution tree available.
            </div>
        );
    }


    /*
     * The API root is normally main().
     *
     * main() normally has one algorithm child.
     *
     * We display main separately and render
     * the algorithm recursion underneath it.
     */

    const children =
        root.children || [];

    const algorithmRoot =
        children.length === 1
            ? children[0]
            : root;


    return (

        <div
            className="
                w-full
                min-w-0
                overflow-visible
                px-5
                pb-[50px]
                pt-7
            "
        >

            {/* =================================================
                MAIN NODE
               ================================================= */}

            {root.methodName === "main" &&
                children.length === 1 && (

                    <div
                        className="
                            flex
                            flex-col
                            items-center
                        "
                    >

                        <NodeCard
                            node={root}
                            onSelect={onSelect}
                        />

                        {/* main → algorithm connector */}

                        <div
                            className="
                                h-[25px]
                                w-px
                                bg-[#59636f]
                            "
                        />

                    </div>

                )}


            {/* =================================================
                RECURSION TREE
               ================================================= */}

            <RecursionTree
                node={algorithmRoot}
                onSelect={onSelect}
            />

        </div>
    );
}