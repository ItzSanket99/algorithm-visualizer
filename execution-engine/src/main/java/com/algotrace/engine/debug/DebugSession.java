package com.algotrace.engine.debug;

import com.sun.jdi.VirtualMachine;
import com.sun.jdi.event.EventQueue;
import com.sun.jdi.request.EventRequestManager;
import lombok.Getter;

@Getter
public class DebugSession implements AutoCloseable {

    /**
     * The launched JVM running the student's program.
     */
    private final VirtualMachine virtualMachine;

    /**
     * Underlying operating system process.
     */
    private final Process process;

    /**
     * Queue from which all debug events are received.
     */
    private final EventQueue eventQueue;

    /**
     * Used to register MethodEntry, MethodExit,
     * Breakpoint, Step and other requests.
     */
    private final EventRequestManager eventRequestManager;

    public DebugSession(VirtualMachine virtualMachine) {

        this.virtualMachine = virtualMachine;
        this.process = virtualMachine.process();
        this.eventQueue = virtualMachine.eventQueue();
        this.eventRequestManager = virtualMachine.eventRequestManager();

    }

    @Override
    public void close() {

        try {

            virtualMachine.dispose();

        } catch (Exception ignored) {
        }

        try {

            process.destroy();

        } catch (Exception ignored) {
        }

    }

}