import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createNotification } from "@app/components/notifications";
import { Button, FormControl, Input, Select, SelectItem } from "@app/components/v2";
import {
  TUserSecretRequest,
  useCreateUserSecret,
  useUpdateUserSecret
} from "@app/hooks/api/userSecrets";
import { UserSecretType, userSecretTypeOptions } from "@app/hooks/api/userSecrets/enum";
import { userSecretSchema } from "@app/hooks/api/userSecrets/schema";
import { UsePopUpState } from "@app/hooks/usePopUp";

const secretNamePlaceholder = {
  [UserSecretType.WEB_LOGIN]: "Google Account, Facebook Account...",
  [UserSecretType.CREDIT_CARD]: "Visa Card, Mastercard...",
  [UserSecretType.SECURE_NOTE]: "Confidential Work Info, Important Account Info...",
  [UserSecretType.WIFI]: "MY WIFI"
};

type Props = {
  popUp: UsePopUpState<["addOrUpdateUserSecret"]>;
  handlePopUpClose: (popUpName: keyof UsePopUpState<["addOrUpdateUserSecret"]>) => void;
};

function removeNullValues(obj: Record<string, any>): Record<string, any> {
  return Object.entries(obj)
    .filter(([, value]) => value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

export const UserSecretForm = ({ popUp, handlePopUpClose }: Props) => {
  const isEditMode = popUp.addOrUpdateUserSecret.data?.isEditMode ?? false;
  const createUserSecret = useCreateUserSecret();
  const updateUserSecret = useUpdateUserSecret();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    watch
  } = useForm<TUserSecretRequest>({
    resolver: zodResolver(userSecretSchema),
    defaultValues: removeNullValues(popUp.addOrUpdateUserSecret?.data?.secretValue || {})
  });

  const onFormSubmit = async (formData: TUserSecretRequest) => {
    try {
      const secretData = formData;

      if (isEditMode) {
        await updateUserSecret.mutateAsync({
          id: popUp.addOrUpdateUserSecret.data?.id,
          updateData: secretData
        });
      } else {
        await createUserSecret.mutateAsync(secretData);
      }

      handlePopUpClose("addOrUpdateUserSecret");
      createNotification({
        text: "Successfully saved your secret",
        type: "success"
      });
    } catch (error) {
      console.error(error);
      createNotification({
        text: "Failed to save your secret",
        type: "error"
      });
    }
  };

  const secretType = watch("secretType");

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Controller
        control={control}
        name="secretType"
        defaultValue={UserSecretType.WEB_LOGIN}
        render={({ field: { onChange, ...field }, fieldState: { error } }) => (
          <FormControl label="Secret Type" errorText={error?.message} isError={Boolean(error)}>
            <Select
              defaultValue={field.value}
              {...field}
              onValueChange={(e) => onChange(e)}
              className="w-full"
            >
              {userSecretTypeOptions.map(({ label, value }) => (
                <SelectItem value={String(value || "")} key={label}>
                  {label}
                </SelectItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field, fieldState: { error } }) => (
          <FormControl label="Secret Name" isError={Boolean(error)} errorText={error?.message}>
            <Input {...field} placeholder={secretNamePlaceholder[secretType]} type="text" />
          </FormControl>
        )}
      />

      {secretType === UserSecretType.WIFI && (
        <Controller
          control={control}
          name="data.wifiPassword"
          render={({ field, fieldState: { error } }) => (
            <FormControl label="Wifi Password" isError={Boolean(error)} errorText={error?.message}>
              <Input {...field} placeholder="******" type="password" />
            </FormControl>
          )}
        />
      )}

      {secretType === UserSecretType.WEB_LOGIN && (
        <>
          <Controller
            control={control}
            name="data.loginURL"
            render={({ field, fieldState: { error } }) => (
              <FormControl
                label="Login URL (Optional)"
                isError={Boolean(error)}
                errorText={error?.message}
              >
                <Input {...field} placeholder="https://example.com/login" type="text" />
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="data.username"
            defaultValue=""
            render={({ field, fieldState: { error } }) => (
              <FormControl
                label="Username / Email"
                isError={Boolean(error)}
                errorText={error?.message}
              >
                <Input {...field} autoComplete="off" placeholder="admin@example.com" type="text" />
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="data.password"
            render={({ field, fieldState: { error } }) => (
              <FormControl label="Password" isError={Boolean(error)} errorText={error?.message}>
                <Input {...field} autoComplete="off" placeholder="" type="password" />
              </FormControl>
            )}
          />
        </>
      )}

      {secretType === UserSecretType.CREDIT_CARD && (
        <>
          <Controller
            control={control}
            name="data.cardNumber"
            render={({ field, fieldState: { error } }) => (
              <FormControl label="Card Number" isError={Boolean(error)} errorText={error?.message}>
                <Input
                  {...field}
                  placeholder="XXXX XXXX XXXX XXXX"
                  inputMode="numeric" // Suggests numeric keyboard on mobile devices
                  type="text"
                />
              </FormControl>
            )}
          />
          <div className="flex w-full flex-row items-start justify-center space-x-2">
            <Controller
              control={control}
              name="data.cardExpiry"
              render={({ field, fieldState: { error } }) => (
                <FormControl
                  label="Expiry Date"
                  isError={Boolean(error)}
                  errorText={error?.message}
                  className="w-1/2"
                >
                  <Input
                    {...field}
                    placeholder="MM/YY"
                    type="text"
                    maxLength={5} // Ensures the input does not exceed MM/YY length
                    inputMode="numeric" // Suggests numeric keyboard on mobile devices
                  />
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="data.cardCvv"
              render={({ field, fieldState: { error } }) => (
                <FormControl
                  label="CVV (Optional)"
                  isError={Boolean(error)}
                  errorText={error?.message}
                  className="w-1/2"
                >
                  <Input
                    {...field}
                    placeholder="XXX"
                    maxLength={4}
                    type="password"
                    inputMode="numeric"
                  />
                </FormControl>
              )}
            />
          </div>
        </>
      )}

      {secretType === UserSecretType.SECURE_NOTE && (
        <Controller
          control={control}
          name="data.secureNote"
          render={({ field, fieldState: { error } }) => (
            <FormControl
              label="Enter Secret Note"
              isError={Boolean(error)}
              errorText={error?.message}
              className="mb-2"
            >
              <textarea
                placeholder="Enter any sensitive data..."
                {...field}
                className="h-40 min-h-[70px] w-full rounded-md border border-mineshaft-600 bg-mineshaft-900 py-1.5 px-2 text-bunker-300 outline-none transition-all placeholder:text-mineshaft-400 placeholder:opacity-50 hover:border-primary-400/30 focus:border-primary-400/50 group-hover:mr-2"
              />
            </FormControl>
          )}
        />
      )}

      <Button
        className="mt-4"
        size="sm"
        type="submit"
        isLoading={isSubmitting}
        isDisabled={isSubmitting}
      >
        {isEditMode ? "Update Secret" : "Add Secret"}
      </Button>
    </form>
  );
};
