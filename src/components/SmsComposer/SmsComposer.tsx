import React from "react"
import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, message } from 'antd'
import "./SmsComposer.css";

const { TextArea } = Input;
interface ApiUrls {
    crm_api_url: string,
    ust_redirect_origin: string,
    ust_api_url: string,
    email_server_api_url: string
}
interface RecipientConfig {
    to: string[];
}
export interface SMSProps {
    editor_content: string;
    recipient_config: RecipientConfig;
    api_url: ApiUrls;
    sender_number: string;
    user_id: string;
    conversation_id: string;
}

const SmsComposer = (props: SMSProps) => {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [isBtnActive, setIsBtnActive] = useState(false);

    // const { data } = props
    // const initialFormData = data ? {sendTo: data.phoneNumber} : {}
    const [initialFormData, setInitialFormData] = useState(props ? {sendTo: props.recipient_config.to, message: props.editor_content}: { sendTo: [], message: '' });

    useEffect(() => {
        if(props.recipient_config) {
            const data = { ...initialFormData, sendTo: props.recipient_config.to, message: props.editor_content };
            setInitialFormData(data);
        }
    }, [props.recipient_config]);

    const onFinish = (values: any) => {
        handleSubmit(values);
    }

    const handleSubmit = async (values: any) => {
        // values._id = data.id;
        values.sendFrom = props.sender_number;
        values.sentBy = props.user_id;
        values.conversationId = props.conversation_id;
        // values.mediaUrl = image;

        setIsLoading(true)

        fetch(props.api_url.email_server_api_url + "sms/send", {
          "method": "POST",
          "headers": {
            "content-type": "application/json",
            "accept": "application/json"
          },
          "body": JSON.stringify(values)
        })
        .then(res => res.json())
        .then(res => {
        setIsLoading(false)
        if (res.message) {
            form.resetFields();
            const widgetEvent = new CustomEvent('close-window-composer', {});
            window.dispatchEvent(widgetEvent);
        }
        })
        .catch(e => {
        setIsLoading(false)
        console.log("Error: ", e)
        });
    }

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo)
    }

    const onValuesChange = (fields: any) => {
        setIsBtnActive(true)
    }

    useEffect(() => {
        if(props.conversation_id) {
          document.querySelector('#message-section').removeEventListener('submit', submitByEvent, false);
          document.querySelector('#message-section').addEventListener('submit', submitByEvent, false);
        }
    }, [props.conversation_id]);
    
    const submitByEvent = () => {
        form.submit();
    }

    // useEffect(() => {
    //     form.resetFields()
    // }, [data]);

    return (
        <>
            { !props.sender_number && <div className="popupNotice">
                <p>You have not yet entered your Vumu Phone Number. You can not send an SMS until its set up. <a href={props.api_url.ust_redirect_origin + "/preferences"} target="_blank">Please click here</a></p>
            </div>
            }
            <Form
                id="newContactForm"
                className="smsArea"
                name="basic"
                form={form}
                initialValues={initialFormData}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                onValuesChange={onValuesChange}
                autoComplete="off"
                layout="vertical"
            >
                <div id="smsReceiver">
                    <Form.Item className="smsRow" label="To" name="sendTo" rules={[{ required: true, message: 'Please enter this field!' }]}>
                        {/* <Input placeholder="Enter phone number" /> */}
                        <Select
                            mode="tags"
                            tokenSeparators={[',']}
                            style={{ width: '100%' }}
                            placeholder="Enter recipient numbers with comma seperated"
                            filterOption={false}
                            className="tagsDropdown"
                            getPopupContainer={() => document.getElementById("smsReceiver")}
                            // defaultValue={props.recipient_config.to}
                        >
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item className="smsRow" label="" name="message" rules={[{ required: true, message: 'Please enter this field!' }]}>
                    <TextArea placeholder="Enter your text here" autoSize/>
                </Form.Item>

                <div className={"smsRow button actionBtns " + (isBtnActive ? "active" : "")}>
                    <Button type="primary" htmlType="submit" size='large' loading={isLoading} disabled={!props.sender_number}>
                        Send via SMS
                    </Button>
                </div>
            </Form>
        </>
      )
}
export default SmsComposer
