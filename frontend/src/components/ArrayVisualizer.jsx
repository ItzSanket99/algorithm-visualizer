export default function ArrayVisualizer({
    event
}) {

    if (!event) {

        return (
            <div className="
                flex
                h-full
                items-center
                justify-center
                text-sm
                text-[#8b949e]
            ">
                No execution state.
            </div>
        );
    }


    const variables =
        event.variables || {};


    /*
     * =========================================================
     * ONLY SHOW REAL USER ARRAYS
     * =========================================================
     */

    const arrays =
        Object.entries(
            variables
        ).filter(
            ([name, value]) => {

                /*
                 * IMPORTANT:
                 *
                 * String[] args is NOT an algorithm array.
                 */

                if (
                    name === "args"
                ) {

                    return false;
                }


                if (
                    value === null ||
                    value === undefined
                ) {

                    return false;
                }


                const text =
                    String(value).trim();


                return (
                    text.startsWith("[") &&
                    text.endsWith("]")
                );

            }
        );


    /*
     * No actual arrays.
     */

    if (arrays.length === 0) {

        return (
            <div className="
                flex
                h-full
                items-center
                justify-center
                text-center
            ">

                <div>

                    <p className="
                        text-sm
                        font-semibold
                        text-[#c9d1d9]
                    ">
                        No array in current state
                    </p>


                    <p className="
                        mt-1
                        text-xs
                        text-[#8b949e]
                    ">
                        This execution state does not contain
                        an algorithm array.
                    </p>

                </div>

            </div>
        );
    }


    return (

        <div className="
            h-full
            space-y-4
            overflow-auto
            p-4
        ">

            {arrays.map(
                ([name, value]) => {

                    const text =
                        String(value)
                            .trim();


                    const content =
                        text
                            .slice(1, -1)
                            .trim();


                    const elements =
                        content.length === 0
                            ? []
                            : content
                                .split(",")
                                .map(
                                    item =>
                                        item.trim()
                                );


                    return (

                        <div
                            key={name}
                            className="
                                overflow-hidden
                                rounded-lg
                                border
                                border-[#30363d]
                                bg-[#0d1117]
                            "
                        >

                            {/* ARRAY HEADER */}

                            <div className="
                                flex
                                items-center
                                justify-between
                                border-b
                                border-[#30363d]
                                bg-[#161b22]
                                px-4
                                py-3
                            ">

                                <div className="
                                    flex
                                    items-center
                                    gap-2
                                ">

                                    <span className="
                                        font-mono
                                        text-sm
                                        font-semibold
                                        text-[#e6edf3]
                                    ">
                                        {name}
                                    </span>


                                    <span className="
                                        rounded
                                        border
                                        border-[#30363d]
                                        px-2
                                        py-0.5
                                        text-[9px]
                                        font-semibold
                                        text-[#8b949e]
                                    ">
                                        ARRAY
                                    </span>

                                </div>


                                <span className="
                                    text-[10px]
                                    text-[#8b949e]
                                ">
                                    length = {elements.length}
                                </span>

                            </div>


                            {/* ARRAY */}

                            <div className="
                                overflow-x-auto
                                p-4
                            ">

                                {elements.length === 0 ? (

                                    <div className="
                                        rounded
                                        border
                                        border-[#30363d]
                                        bg-[#161b22]
                                        py-8
                                        text-center
                                        text-xs
                                        text-[#8b949e]
                                    ">
                                        Empty array
                                    </div>

                                ) : (

                                    <div className="
                                        flex
                                        min-w-max
                                    ">

                                        {elements.map(
                                            (element, index) => (

                                                <div
                                                    key={index}
                                                    className="
                                                        w-20
                                                        shrink-0
                                                    "
                                                >

                                                    {/* INDEX */}

                                                    <div className="
                                                        text-center
                                                        text-[10px]
                                                        text-[#8b949e]
                                                    ">
                                                        {index}
                                                    </div>


                                                    {/* VALUE */}

                                                    <div className="
                                                        flex
                                                        h-12
                                                        items-center
                                                        justify-center
                                                        border
                                                        border-[#30363d]
                                                        bg-[#161b22]
                                                        font-mono
                                                        text-sm
                                                        font-semibold
                                                        text-[#e6edf3]
                                                    ">
                                                        {element}
                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        </div>

                    );
                }
            )}

        </div>
    );
}